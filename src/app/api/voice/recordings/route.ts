import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { creditWallet } from "@/lib/server/wallet";
import { addXp, incrementMissionProgress, checkAchievements } from "@/lib/server/gamification";
import { payReferralCommission } from "@/lib/server/referral-commission";
import { getVoiceAiProvider } from "@/lib/voice-ai/provider";
import {
  hashAudioBuffer,
  analyzeAudioEnergy,
  detectBackgroundNoiseHeuristic,
  isProbableReplay,
  analyzePitchContour,
  estimateSynthesizedVoiceLikelihood,
} from "@/lib/voice-ai/detectors";
import { saveUploadedFile } from "@/lib/server/storage";
import { upsertDevice, estimateVpnSuspicion } from "@/lib/server/device";
import { rateLimit } from "@/lib/server/rate-limit";
import { XP_CONFIG, TIER_CONFIG } from "@/lib/config";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";
import { isActivePlanRequired } from "@/lib/server/plan-gate";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    const recordings = await prisma.voiceRecording.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { voiceTask: { select: { title: true } }, aiResult: true },
    });
    return NextResponse.json({ recordings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user.emailVerified) {
      return jsonError("Please verify your email before submitting voice tasks", 403);
    }
    if ((await isActivePlanRequired()) && !user.planId) {
      return jsonError("Activate a plan to submit voice tasks", 403);
    }

    const { ipAddress, userAgent } = getRequestMeta(req);
    const limited = await rateLimit(`voice-submit:${user.id}`, 15, 60 * 60 * 1000);
    if (!limited.success) {
      return jsonError("Too many submissions. Please slow down.", 429);
    }

    const form = await req.formData();
    const file = form.get("audio");
    const voiceTaskId = form.get("voiceTaskId");
    const durationSec = Number(form.get("durationSec"));
    const fingerprint = String(form.get("fingerprint") ?? "unknown");

    if (!(file instanceof Blob) || typeof voiceTaskId !== "string" || Number.isNaN(durationSec)) {
      return jsonError("Missing or invalid recording data", 422);
    }

    const voiceTask = await prisma.voiceTask.findUnique({ where: { id: voiceTaskId } });
    if (!voiceTask || !voiceTask.isActive) {
      return jsonError("This voice task is not available", 404);
    }
    if (durationSec < voiceTask.minDuration || durationSec > voiceTask.maxDuration) {
      return jsonError(
        `Recording must be between ${voiceTask.minDuration}s and ${voiceTask.maxDuration}s`,
        422
      );
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayCount = await prisma.voiceRecording.count({
      where: { userId: user.id, voiceTaskId, createdAt: { gte: startOfDay } },
    });
    const effectiveDailyLimit = voiceTask.dailyLimit * TIER_CONFIG[user.tier].dailyLimitMultiplier;
    if (todayCount >= effectiveDailyLimit) {
      return jsonError("You've reached today's limit for this task", 429);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const audioHash = hashAudioBuffer(buffer);

    const vpnSuspected = estimateVpnSuspicion(req);
    const device = await upsertDevice({
      userId: user.id,
      fingerprint,
      userAgent,
      ipAddress,
      vpnSuspected,
    });

    const existingWithHash = await prisma.voiceRecording.findFirst({
      where: { audioHash },
      include: { device: true },
    });
    const isDuplicate = Boolean(existingWithHash);
    const isReplayAttack = existingWithHash
      ? isProbableReplay({
          sameHashCount: 1,
          sameHashFromSameDevice: existingWithHash.deviceId === device.id,
        })
      : false;

    // Prefer real decoded-audio RMS analysis; fall back to the weaker
    // byte-level heuristic only when the clip can't be decoded (e.g.
    // Safari's audio/mp4 output isn't a WebM container).
    const noise = (await analyzeAudioEnergy(buffer, file.type || "audio/webm")) ?? detectBackgroundNoiseHeuristic(buffer);

    const provider = getVoiceAiProvider();
    const transcription = await provider.transcribe(buffer, file.type || "audio/webm");

    // Prefer real pitch-contour analysis on decoded PCM; fall back to the
    // weaker confidence+filesize heuristic only when the clip can't be
    // decoded or has too little voiced signal to read a pitch contour from.
    const pitchAnalysis = await analyzePitchContour(buffer, file.type || "audio/webm");
    const isSynthesizedVoice =
      pitchAnalysis?.flagged ??
      estimateSynthesizedVoiceLikelihood({
        confidence: transcription.confidence,
        byteLength: buffer.byteLength,
      });

    const passed =
      !isDuplicate && !isReplayAttack && !noise.flagged && !isSynthesizedVoice && transcription.confidence >= 0.6;

    // A user's active plan re-prices every voice activity at a flat rate for
    // that activity type (session vs word game), overriding the individual
    // task's own rewardAmount. Users with no active plan keep today's
    // per-task reward.
    const plan = user.planId ? await prisma.plan.findUnique({ where: { id: user.planId } }) : null;
    const effectiveReward = plan
      ? voiceTask.category === "word_game"
        ? plan.wordGameReward
        : plan.voiceSessionReward
      : voiceTask.rewardAmount;

    const audioUrl = await saveUploadedFile({
      folder: "voice",
      buffer,
      extension: (file.type.split("/")[1] || "webm").split(";")[0],
    });

    const result = await prisma.$transaction(async (tx) => {
      const recording = await tx.voiceRecording.create({
        data: {
          userId: user.id,
          voiceTaskId,
          audioUrl,
          audioHash,
          durationSec,
          deviceId: device.id,
          status: passed ? "APPROVED" : isDuplicate || isReplayAttack || isSynthesizedVoice ? "FLAGGED" : "REJECTED",
          rewardAmount: passed ? effectiveReward : null,
          reviewedAt: new Date(),
        },
      });

      await tx.aiResult.create({
        data: {
          recordingId: recording.id,
          provider: provider.name,
          transcript: transcription.transcript,
          confidence: transcription.confidence,
          isDuplicate,
          isReplayAttack,
          hasBackgroundNoise: noise.flagged,
          isSynthesizedVoice,
          passed,
          rawResponse: transcription.raw as never,
        },
      });

      if (passed) {
        await creditWallet({
          userId: user.id,
          type: "ENGAGEMENT",
          amount: Number(effectiveReward),
          reason: "VOICE_TASK_REWARD",
          description: `Voice task reward: ${voiceTask.title}`,
          client: tx,
        });
        await addXp(user.id, XP_CONFIG.perVoiceTask, tx);
        await incrementMissionProgress(user.id, "VOICE_TASK", 1, tx);
        await checkAchievements(user.id, "VOICE_TASK_APPROVED", tx);
        await payReferralCommission({
          earnerId: user.id,
          earnedAmount: Number(effectiveReward),
          sourceReason: "VOICE_TASK_REWARD",
          client: tx,
        });
      }

      if (isDuplicate || isReplayAttack || isSynthesizedVoice) {
        await tx.fraudReport.create({
          data: {
            userId: user.id,
            type: isReplayAttack ? "REPLAY_ATTACK" : isSynthesizedVoice ? "SYNTHESIZED_VOICE" : "DUPLICATE_AUDIO",
            details: `Flagged on recording ${recording.id} (hash ${audioHash.slice(0, 12)}…)`,
            severity: isReplayAttack ? "HIGH" : "MEDIUM",
          },
        });
      }

      return recording;
    });

    await writeAuditLog({
      userId: user.id,
      action: "voice.submit",
      ipAddress,
      userAgent,
      metadata: { recordingId: result.id, passed },
    });

    return NextResponse.json({
      recording: result,
      passed,
      reward: passed ? Number(effectiveReward) : 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, SponsoredPlatform } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { creditWallet } from "@/lib/server/wallet";
import { addXp, incrementMissionProgress, dateOnlyKey } from "@/lib/server/gamification";
import { payReferralCommission } from "@/lib/server/referral-commission";
import { saveUploadedFile } from "@/lib/server/storage";
import { hashBuffer } from "@/lib/server/file-hash";
import { getSetting } from "@/lib/server/settings";
import { XP_CONFIG } from "@/lib/config";

const schema = z.object({ platform: z.nativeEnum(SponsoredPlatform) });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user.emailVerified) {
      return jsonError("Please verify your email before submitting sponsored posts", 403);
    }

    const form = await req.formData();
    const { platform } = schema.parse({ platform: form.get("platform") });
    const proofImage = form.get("proofImage");
    if (!(proofImage instanceof Blob)) {
      return jsonError("Please upload a screenshot of your post", 422);
    }

    const [caption, linkUrl, rewardAmount] = await Promise.all([
      getSetting("sponsored_post_caption", ""),
      getSetting("sponsored_post_link_url", ""),
      getSetting("sponsored_post_reward_amount", 50),
    ]);
    if (!caption || !linkUrl) {
      return jsonError("Sponsored posts aren't configured right now. Please check back later.", 422);
    }

    const buffer = Buffer.from(await proofImage.arrayBuffer());
    const proofImageHash = hashBuffer(buffer);
    const extension = (proofImage.type.split("/")[1] || "jpg").split(";")[0];
    const proofImageUrl = await saveUploadedFile({ folder: "sponsored", buffer, extension });
    const today = dateOnlyKey();

    // A screenshot that's already been submitted (by anyone, for any
    // platform) can't be reused to farm repeat rewards - same trust model as
    // the Task Center's proof-based tasks.
    const duplicate = await prisma.sponsoredShare.findFirst({ where: { proofImageHash } });
    if (duplicate) {
      try {
        await prisma.sponsoredShare.create({
          data: {
            userId: user.id,
            platform,
            date: today,
            status: "REJECTED",
            proofImageUrl,
            proofImageHash,
            rewardPaid: 0,
            reviewNote: "This screenshot has already been submitted before.",
          },
        });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
      }
      return jsonError("This screenshot has already been submitted - please share a fresh post.", 409);
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const share = await tx.sponsoredShare.create({
          data: {
            userId: user.id,
            platform,
            date: today,
            status: "APPROVED",
            proofImageUrl,
            proofImageHash,
            rewardPaid: rewardAmount,
          },
        });

        await creditWallet({
          userId: user.id,
          type: "ENGAGEMENT",
          amount: rewardAmount,
          reason: "SPONSORED_POST_REWARD",
          description: `Sponsored post shared on ${platform}`,
          client: tx,
        });
        await addXp(user.id, XP_CONFIG.perTaskCenter, tx);
        await incrementMissionProgress(user.id, "TASK_CENTER", 1, tx);
        await payReferralCommission({
          earnerId: user.id,
          earnedAmount: rewardAmount,
          sourceReason: "SPONSORED_POST_REWARD",
          client: tx,
        });

        return share;
      });

      return NextResponse.json({ share: result, reward: rewardAmount });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return jsonError("You've already shared this platform today. Come back tomorrow.", 409);
      }
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}

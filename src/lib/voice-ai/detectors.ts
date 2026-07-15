import crypto from "crypto";

export function hashAudioBuffer(buffer: Buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Heuristic background-noise / silence check on raw PCM-ish bytes.
 * This is a placeholder signal-processing pass (no real DSP library in the
 * MVP) — it flags clips whose byte-level amplitude variance is implausibly
 * low (near-silent or flat/looped audio), which tends to correlate with
 * noise-only or corrupted recordings. Replace with a proper RMS/VAD analysis
 * (e.g. via ffmpeg or a WASM audio analyzer) for production-grade detection.
 */
export function detectBackgroundNoiseHeuristic(buffer: Buffer): { flagged: boolean; variance: number } {
  if (buffer.byteLength < 200) return { flagged: true, variance: 0 };

  const sampleCount = Math.min(buffer.byteLength, 20_000);
  let mean = 0;
  for (let i = 0; i < sampleCount; i++) mean += buffer[i];
  mean /= sampleCount;

  let variance = 0;
  for (let i = 0; i < sampleCount; i++) variance += (buffer[i] - mean) ** 2;
  variance /= sampleCount;

  return { flagged: variance < 15, variance: Number(variance.toFixed(2)) };
}

/**
 * Replay-attack heuristic: same audio hash reused across recordings from a
 * different device/session than the original counts as a probable replay.
 * The actual DB lookup happens in the caller (needs Prisma); this just
 * centralizes the decision rule.
 */
export function isProbableReplay(params: {
  sameHashCount: number;
  sameHashFromSameDevice: boolean;
}) {
  return params.sameHashCount > 0 && !params.sameHashFromSameDevice;
}

/**
 * Placeholder AI/synthesized-voice detector. Real detection needs a trained
 * classifier (e.g. a spectrogram-based model); until one is wired in behind
 * VOICE_AI_PROVIDER, this only flags the extreme case of an unnaturally
 * perfect transcription confidence paired with a suspiciously tiny file,
 * which is more likely a generated/looped clip than a genuine phone
 * recording.
 */
export function estimateSynthesizedVoiceLikelihood(params: { confidence: number; byteLength: number }) {
  return params.confidence > 0.98 && params.byteLength < 5_000;
}

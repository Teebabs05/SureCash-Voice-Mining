import crypto from "crypto";
import decodeWebm from "@audio/decode-webm";

export function hashAudioBuffer(buffer: Buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Real RMS-energy silence/background-noise-only check on genuinely decoded
 * PCM samples (webm/opus — the format Chrome/most Android MediaRecorders
 * produce). Threshold calibrated empirically: recorded real silence via
 * Chrome's fake-audio-capture device end-to-end through actual
 * getUserMedia -> MediaRecorder -> Opus encoding, decoded it back with
 * @audio/decode-webm, and measured RMS ~0.00006 for silence/mic self-noise
 * vs ~0.0066+ for even a very quiet tone — 0.001 sits comfortably between
 * the two with over an order of magnitude of margin on both sides.
 * Returns null (not flagged/not-flagged) when the clip can't be decoded
 * (e.g. Safari's audio/mp4 output isn't a WebM container) so the caller can
 * fall back to detectBackgroundNoiseHeuristic instead.
 */
const SILENCE_RMS_THRESHOLD = 0.001;

export async function analyzeAudioEnergy(
  buffer: Buffer,
  mimeType: string
): Promise<{ flagged: boolean; rms: number } | null> {
  if (!mimeType.includes("webm")) return null;

  try {
    const { channelData } = await decodeWebm(buffer);
    const samples = channelData[0];
    if (!samples || samples.length === 0) return { flagged: true, rms: 0 };

    let sumSquares = 0;
    for (let i = 0; i < samples.length; i++) sumSquares += samples[i] * samples[i];
    const rms = Math.sqrt(sumSquares / samples.length);

    return { flagged: rms < SILENCE_RMS_THRESHOLD, rms: Number(rms.toFixed(6)) };
  } catch {
    return null;
  }
}

/**
 * Byte-level fallback used only when the clip can't be decoded to real PCM
 * (analyzeAudioEnergy returned null — unsupported container/codec, or a
 * corrupt file). Much weaker signal than real RMS analysis since it's
 * operating on compressed bytes rather than actual sample amplitudes, but
 * still catches the obvious case of a near-empty/corrupt upload.
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

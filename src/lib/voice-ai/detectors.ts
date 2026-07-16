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
 * Byte/confidence-only fallback used when analyzePitchContour can't produce
 * a reading (undecodable container, or too little voiced signal). Much
 * weaker than real pitch analysis - only catches the extreme case of an
 * unnaturally perfect transcription confidence paired with a suspiciously
 * tiny file, more likely a generated/looped clip than a genuine recording.
 */
export function estimateSynthesizedVoiceLikelihood(params: { confidence: number; byteLength: number }) {
  return params.confidence > 0.98 && params.byteLength < 5_000;
}

const F0_MIN_HZ = 70;
const F0_MAX_HZ = 400;
const FRAME_SEC = 0.03;
const HOP_SEC = 0.015;
const VOICING_THRESHOLD = 0.35;
const MIN_VOICED_FRAMES = 15;

/**
 * Flat/monotone-pitch threshold: real speech carries prosodic intonation
 * (pitch rises and falls across an utterance) even in short, calm
 * recordings, while flat TTS voices hold a near-constant pitch. Calibrated
 * end-to-end through the real capture pipeline (getUserMedia -> Chrome's
 * default audio processing -> MediaRecorder -> Opus -> decodeWebm) using
 * Chrome's fake-audio-capture device fed two synthetic buzz-tone WAVs: a
 * perfectly flat 150Hz tone (proxy for a monotone TTS read) measured a
 * pitchRange of ~0.018, and the same tone with per-cycle jitter plus a
 * slow rise/fall intonation contour (proxy for natural prosody) measured
 * ~0.154 - over 8x apart. 0.05 sits comfortably between the two. A raw
 * frame-to-frame jitter measure was also tried but its own quantization
 * noise floor (even after parabolic sub-sample interpolation) swamped the
 * signal at realistic jitter magnitudes, so it's reported for admin
 * visibility only and doesn't gate the flag.
 */
const PITCH_RANGE_FLAT_THRESHOLD = 0.05;

/** Autocorrelation-based F0 estimate for one frame, with parabolic
 * interpolation around the integer-lag peak for sub-sample precision
 * (plain integer-lag search quantizes F0 in ~1-2Hz steps at typical
 * sample rates, which otherwise reads as spurious jitter). Returns null
 * when the frame isn't confidently voiced (normalized autocorrelation
 * peak below VOICING_THRESHOLD). */
function autocorrelationPitch(frame: Float32Array, sampleRate: number): number | null {
  const minLag = Math.floor(sampleRate / F0_MAX_HZ);
  const maxLag = Math.min(Math.floor(sampleRate / F0_MIN_HZ), frame.length - 2);

  let energy = 0;
  for (let i = 0; i < frame.length; i++) energy += frame[i] * frame[i];
  if (energy < 1e-9) return null;

  const corrAt = (lag: number) => {
    let corr = 0;
    for (let i = 0; i < frame.length - lag; i++) corr += frame[i] * frame[i + lag];
    return corr;
  };

  let bestLag = -1;
  let bestCorr = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    const corr = corrAt(lag);
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }
  if (bestLag === -1) return null;
  if (bestCorr / energy < VOICING_THRESHOLD) return null;

  const cPrev = bestLag > minLag ? corrAt(bestLag - 1) : bestCorr;
  const cNext = corrAt(bestLag + 1);
  const denom = cPrev - 2 * bestCorr + cNext;
  const shift = denom !== 0 ? (0.5 * (cPrev - cNext)) / denom : 0;
  const refinedLag = bestLag + Math.max(-1, Math.min(1, shift));

  return sampleRate / refinedLag;
}

/**
 * Real pitch-contour analysis on decoded PCM: tracks F0 across the clip via
 * frame-by-frame autocorrelation and flags an unnaturally flat pitch range,
 * the signature of a monotone TTS read rather than natural prosody. Returns
 * null (inconclusive) when the clip can't be decoded or has too little
 * confidently-voiced signal to estimate a pitch contour from (e.g. mostly
 * silence/consonants), so the caller can fall back to
 * estimateSynthesizedVoiceLikelihood instead.
 */
export async function analyzePitchContour(
  buffer: Buffer,
  mimeType: string
): Promise<{ flagged: boolean; pitchRange: number; jitter: number; voicedFrames: number } | null> {
  if (!mimeType.includes("webm")) return null;

  try {
    const { channelData, sampleRate } = await decodeWebm(buffer);
    const samples = channelData[0];
    if (!samples || samples.length === 0) return null;

    const frameSize = Math.floor(sampleRate * FRAME_SEC);
    const hopSize = Math.floor(sampleRate * HOP_SEC);
    const f0s: number[] = [];
    for (let start = 0; start + frameSize <= samples.length; start += hopSize) {
      const f0 = autocorrelationPitch(samples.subarray(start, start + frameSize), sampleRate);
      if (f0 !== null) f0s.push(f0);
    }

    if (f0s.length < MIN_VOICED_FRAMES) return null;

    let jitterSum = 0;
    for (let i = 1; i < f0s.length; i++) jitterSum += Math.abs(f0s[i] - f0s[i - 1]) / f0s[i];
    const jitter = jitterSum / (f0s.length - 1);
    const mean = f0s.reduce((a, b) => a + b, 0) / f0s.length;
    const pitchRange = (Math.max(...f0s) - Math.min(...f0s)) / mean;

    return {
      flagged: pitchRange < PITCH_RANGE_FLAT_THRESHOLD,
      pitchRange: Number(pitchRange.toFixed(4)),
      jitter: Number(jitter.toFixed(4)),
      voicedFrames: f0s.length,
    };
  } catch {
    return null;
  }
}

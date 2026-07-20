// A few task prompts frame the word to say as an instruction ("Pronounce
// the word: opportunity") but only the word itself is meant to be spoken -
// strip that framing before comparing so those tasks aren't scored against
// text the user was never supposed to say aloud.
const INSTRUCTIONAL_PREFIX = /^(pronounce the word|say the word|read the word|say|read|repeat)\s*:\s*/i;

/** Strips instructional framing off a prompt for display purposes, e.g. "Pronounce the word: opportunity" -> "opportunity". */
export function stripInstructionalPrefix(prompt: string): string {
  return prompt.replace(INSTRUCTIONAL_PREFIX, "").trim();
}

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Scores how well a transcript matches the required prompt text, as the
 * fraction of the prompt's words that also appear somewhere in the
 * transcript. Order-insensitive and tolerant of minor misrecognition -
 * real speech-to-text output can drop or reorder a word without the
 * reading actually being wrong - but a transcript sharing few or none of
 * the expected words means the user very likely didn't read the prompt.
 */
export function scorePromptMatch(transcript: string, expectedPrompt: string): number {
  const expectedWords = normalizeWords(stripInstructionalPrefix(expectedPrompt));
  if (expectedWords.length === 0) return 1;

  const transcriptWords = new Set(normalizeWords(transcript));
  const matched = expectedWords.filter((w) => transcriptWords.has(w)).length;
  return matched / expectedWords.length;
}

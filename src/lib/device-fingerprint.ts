// Lightweight, dependency-free browser fingerprint. Not cryptographically
// strong (a determined attacker can spoof it) but good enough as an MVP
// signal for duplicate-device / replay-attack heuristics. Consider
// FingerprintJS if stronger uniqueness is needed later.
export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === "undefined") return "server";

  const stored = localStorage.getItem("sc_device_fp");
  if (stored) return stored;

  const parts = [
    navigator.userAgent,
    navigator.language,
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(navigator.hardwareConcurrency ?? ""),
  ].join("|");

  const encoded = new TextEncoder().encode(parts + crypto.randomUUID());
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const hash = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  localStorage.setItem("sc_device_fp", hash);
  return hash;
}

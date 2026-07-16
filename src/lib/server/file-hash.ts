import "server-only";
import crypto from "crypto";

/** Generic content hash for duplicate-file detection (receipts, proof
 * screenshots) - same sha256-of-bytes approach as the voice recording
 * dedup check, just not audio-specific. */
export function hashBuffer(buffer: Buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

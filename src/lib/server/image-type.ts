import "server-only";

// Checks the file's actual bytes, not just the label the browser attached to
// it - a phone photo can arrive mislabeled (or in a format like HEIC that
// browsers can't render in an <img> tag at all), which would otherwise save
// successfully but then show as a broken image everywhere it's displayed.
export function detectImageType(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "image/png";
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return "image/webp";
  const head = buffer.subarray(0, 256).toString("utf8").trimStart();
  if (head.startsWith("<?xml") || head.startsWith("<svg")) return "image/svg+xml";
  return null;
}

export const NOT_AN_IMAGE_MESSAGE =
  "This doesn't look like a JPEG, PNG, WebP, or SVG file. If it's a photo from an iPhone, make sure it's not in HEIC format — convert it to JPG first, or take a screenshot of it and upload that instead.";

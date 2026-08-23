import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { saveUploadedFile } from "@/lib/server/storage";
import { setSetting } from "@/lib/server/settings";
import { detectImageType, NOT_AN_IMAGE_MESSAGE } from "@/lib/server/image-type";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const form = await req.formData();
    const banner = form.get("banner");

    if (!(banner instanceof Blob)) return jsonError("No image uploaded", 422);
    if (banner.size > MAX_BYTES) return jsonError("Banner must be under 8MB", 422);

    const buffer = Buffer.from(await banner.arrayBuffer());
    const detectedType = detectImageType(buffer);
    if (!detectedType || !ALLOWED_TYPES.has(detectedType)) {
      return jsonError(NOT_AN_IMAGE_MESSAGE, 422);
    }

    const extension = detectedType.split("/")[1];
    const bannerUrl = await saveUploadedFile({ folder: "sponsored", buffer, extension });

    await setSetting("sponsored_post_banner_url", bannerUrl);

    return NextResponse.json({ bannerUrl });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    await requireAdmin();
    await setSetting("sponsored_post_banner_url", "");
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

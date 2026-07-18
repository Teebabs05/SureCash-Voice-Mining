import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { saveUploadedFile } from "@/lib/server/storage";
import { setSetting } from "@/lib/server/settings";

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const form = await req.formData();
    const logo = form.get("logo");

    if (!(logo instanceof Blob)) return jsonError("No image uploaded", 422);
    if (!ALLOWED_TYPES.has(logo.type)) return jsonError("Logo must be JPEG, PNG, WebP, or SVG", 422);
    if (logo.size > MAX_BYTES) return jsonError("Logo must be under 3MB", 422);

    const buffer = Buffer.from(await logo.arrayBuffer());
    const extension = logo.type.split("/")[1].replace("svg+xml", "svg");
    const logoUrl = await saveUploadedFile({ folder: "branding", buffer, extension });

    await setSetting("site_logo_url", logoUrl);

    return NextResponse.json({ logoUrl });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    await requireAdmin();
    await setSetting("site_logo_url", "");
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

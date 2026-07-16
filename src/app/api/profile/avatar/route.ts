import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { saveUploadedFile } from "@/lib/server/storage";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const form = await req.formData();
    const avatar = form.get("avatar");

    if (!(avatar instanceof Blob)) return jsonError("No image uploaded", 422);
    if (!ALLOWED_TYPES.has(avatar.type)) return jsonError("Image must be JPEG, PNG, or WebP", 422);
    if (avatar.size > MAX_BYTES) return jsonError("Image must be under 5MB", 422);

    const buffer = Buffer.from(await avatar.arrayBuffer());
    const extension = avatar.type.split("/")[1];
    const avatarUrl = await saveUploadedFile({ folder: "avatars", buffer, extension });

    await prisma.user.update({ where: { id: user.id }, data: { avatarUrl } });

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    return handleApiError(error);
  }
}

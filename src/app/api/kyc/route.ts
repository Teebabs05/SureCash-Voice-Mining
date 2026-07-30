import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { saveUploadedFile } from "@/lib/server/storage";
import { writeAuditLog, getRequestMeta } from "@/lib/server/audit";

export async function GET() {
  try {
    const user = await requireUser();
    const documents = await prisma.kycDocument.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ kycStatus: user.kycStatus, documents });
  } catch (error) {
    return handleApiError(error);
  }
}

const schema = z.object({ documentType: z.string().trim().min(2).max(50) });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (user.kycStatus === "APPROVED") {
      return jsonError("Your identity is already verified", 400);
    }

    const { ipAddress, userAgent } = getRequestMeta(req);
    const form = await req.formData();
    const { documentType } = schema.parse({ documentType: form.get("documentType") });
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return jsonError("Please attach a document", 422);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = (file.type.split("/")[1] || "jpg").split(";")[0];
    const fileUrl = await saveUploadedFile({ folder: "kyc", buffer, extension });

    const document = await prisma.$transaction(async (tx) => {
      const doc = await tx.kycDocument.create({
        data: { userId: user.id, documentType, fileUrl, status: "PENDING" },
      });
      await tx.user.update({ where: { id: user.id }, data: { kycStatus: "PENDING" } });
      return doc;
    });

    await writeAuditLog({
      userId: user.id,
      action: "kyc.submit",
      ipAddress,
      userAgent,
      metadata: { documentId: document.id, documentType },
    });

    return NextResponse.json({ document });
  } catch (error) {
    return handleApiError(error);
  }
}

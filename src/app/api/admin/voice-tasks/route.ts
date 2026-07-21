import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

const schema = z.object({
  title: z.string().min(2),
  promptText: z.string().min(2),
  language: z.string().default("en"),
  category: z.enum(["session", "word_game"]).default("session"),
  syllables: z.string().optional(),
  rewardAmount: z.number().positive(),
  dailyLimit: z.number().int().positive().default(5),
  minDuration: z.number().int().positive().default(3),
  maxDuration: z.number().int().positive().default(30),
});

export async function GET() {
  try {
    await requireAdmin();
    const tasks = await prisma.voiceTask.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ tasks });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = schema.parse(await req.json());
    const task = await prisma.voiceTask.create({ data: body });
    return NextResponse.json({ task });
  } catch (error) {
    return handleApiError(error);
  }
}

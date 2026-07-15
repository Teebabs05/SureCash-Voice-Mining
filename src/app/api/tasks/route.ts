import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";

export async function GET() {
  try {
    const user = await requireUser();
    const tasks = await prisma.taskCenterTask.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } });
    const completions = await prisma.userTaskCompletion.findMany({ where: { userId: user.id } });
    const statusByTask = new Map(completions.map((c) => [c.taskId, c.status]));

    return NextResponse.json({
      tasks: tasks.map((t) => {
        const status = statusByTask.get(t.id);
        return {
          ...t,
          isCompleted: !t.isRepeatable && status !== undefined && status !== "REJECTED",
          isPending: status === "PENDING_REVIEW",
        };
      }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

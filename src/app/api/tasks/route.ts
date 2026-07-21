import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { checkFeatureAccess } from "@/lib/server/plan-gate";
import { dateOnlyKey } from "@/lib/server/gamification";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const access = await checkFeatureAccess(user, "taskCenter");
    const category = req.nextUrl.searchParams.get("category");
    const typeFilter =
      category === "sponsored" ? { type: "sponsored_post" } : { type: { not: "sponsored_post" } };
    const tasks = access.allowed
      ? await prisma.taskCenterTask.findMany({
          where: { isActive: true, ...typeFilter },
          orderBy: { createdAt: "desc" },
        })
      : [];
    const completions = await prisma.userTaskCompletion.findMany({ where: { userId: user.id } });
    const statusByTask = new Map(completions.map((c) => [c.taskId, c.status]));
    const checkedInToday = Boolean(
      user.lastCheckInAt && dateOnlyKey(user.lastCheckInAt).getTime() === dateOnlyKey().getTime()
    );

    return NextResponse.json({
      planRequired: access.reason === "no_plan",
      needsHigherPlan: access.reason === "plan_restricted",
      tasks: tasks.map((t) => {
        const status = statusByTask.get(t.id);
        return {
          ...t,
          isCompleted:
            t.type === "checkin" ? checkedInToday : !t.isRepeatable && status !== undefined && status !== "REJECTED",
          isPending: status === "PENDING_REVIEW",
        };
      }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

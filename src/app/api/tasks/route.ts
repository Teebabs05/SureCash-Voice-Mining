import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { isActivePlanRequired, planSectionDailyLimit } from "@/lib/server/plan-gate";
import { dateOnlyKey } from "@/lib/server/gamification";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const planRequired = (await isActivePlanRequired()) && !user.planId;
    const [plan, sectionCompletedToday] = await Promise.all([
      user.planId ? prisma.plan.findUnique({ where: { id: user.planId } }) : null,
      prisma.userTaskCompletion.count({ where: { userId: user.id, createdAt: { gte: startOfDay } } }),
    ]);
    const sectionDailyLimit = planSectionDailyLimit(plan, "taskCenter");
    const sectionLimitReached = sectionDailyLimit !== null && sectionCompletedToday >= sectionDailyLimit;

    const category = req.nextUrl.searchParams.get("category");
    const typeFilter =
      category === "sponsored" ? { type: "sponsored_post" } : { type: { not: "sponsored_post" } };
    // Tasks stay browsable with no active plan - a user can try them for
    // free, they just earn nothing until they activate a plan (below). Only
    // a plan-holder's own daily quota actually hides the list.
    const tasks = sectionLimitReached
      ? []
      : await prisma.taskCenterTask.findMany({
          where: { isActive: true, ...typeFilter },
          orderBy: { createdAt: "desc" },
        });
    const completions = await prisma.userTaskCompletion.findMany({ where: { userId: user.id } });
    const statusByTask = new Map(completions.map((c) => [c.taskId, c.status]));
    const checkedInToday = Boolean(
      user.lastCheckInAt && dateOnlyKey(user.lastCheckInAt).getTime() === dateOnlyKey().getTime()
    );

    return NextResponse.json({
      planRequired,
      sectionDailyLimit,
      sectionCompletedToday,
      tasks: tasks.map((t) => {
        const status = statusByTask.get(t.id);
        return {
          ...t,
          rewardAmount: planRequired ? "0" : t.rewardAmount,
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

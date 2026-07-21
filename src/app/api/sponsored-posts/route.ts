import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError } from "@/lib/server/api-response";
import { getSetting } from "@/lib/server/settings";
import { dateOnlyKey } from "@/lib/server/gamification";
import { isActivePlanRequired, planSectionDailyLimit } from "@/lib/server/plan-gate";

const PLATFORMS = ["FACEBOOK", "INSTAGRAM", "TIKTOK", "WHATSAPP"] as const;

export async function GET() {
  try {
    const user = await requireUser();
    const planRequired = (await isActivePlanRequired()) && !user.planId;

    const [caption, bannerUrl, linkUrl, rewardAmount, plan] = await Promise.all([
      getSetting("sponsored_post_caption", ""),
      getSetting("sponsored_post_banner_url", ""),
      getSetting("sponsored_post_link_url", ""),
      getSetting("sponsored_post_reward_amount", 50),
      user.planId ? prisma.plan.findUnique({ where: { id: user.planId } }) : null,
    ]);

    const today = dateOnlyKey();
    const shares = await prisma.sponsoredShare.findMany({ where: { userId: user.id, date: today } });
    const shareByPlatform = new Map(shares.map((s) => [s.platform, s]));
    const sectionCompletedToday = shares.filter((s) => s.status === "APPROVED").length;
    const sectionDailyLimit = planSectionDailyLimit(plan, "sponsoredPosts");
    const sectionLimitReached = sectionDailyLimit !== null && sectionCompletedToday >= sectionDailyLimit;

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/share`;

    return NextResponse.json({
      planRequired,
      sectionDailyLimit,
      sectionCompletedToday,
      configured: Boolean(caption && linkUrl),
      caption,
      bannerUrl,
      linkUrl,
      shareUrl,
      rewardAmount,
      platforms:
        planRequired || sectionLimitReached
          ? []
          : PLATFORMS.map((platform) => {
              const share = shareByPlatform.get(platform);
              return {
                platform,
                status: share ? share.status : "AVAILABLE",
                reviewNote: share?.reviewNote ?? null,
              };
            }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

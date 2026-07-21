import Link from "next/link";
import { Crown, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

/** Banner shown when a feature is blocked by plan status - either the user
 * has no plan at all (and one is required), or they've used up today's
 * plan-tier quota for this section. Distinct copy/color so it's clear which
 * one applies and what to do about it. */
export function PlanGateBanner({
  reason,
  feature,
  dailyLimit,
}: {
  reason: "no_plan" | "limit_reached";
  feature: string;
  dailyLimit?: number;
}) {
  if (reason === "limit_reached") {
    return (
      <Card className="flex items-center gap-3 border border-brand-primary/30 bg-brand-primary/10 p-4">
        <Clock className="h-5 w-5 flex-none text-brand-primary" />
        <div className="flex-1">
          <p className="text-sm font-semibold">You&apos;ve used today&apos;s limit to {feature}</p>
          <p className="text-xs text-foreground/60">
            {dailyLimit ? `Your plan allows ${dailyLimit}/day here. ` : ""}Upgrade for a higher daily limit, or come
            back tomorrow.
          </p>
        </div>
        <Link href="/plans" className="flex-none rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-bold text-white">
          Upgrade
        </Link>
      </Card>
    );
  }

  return (
    <Card className="flex items-center gap-3 border border-brand-amber/30 bg-brand-amber/10 p-4">
      <Crown className="h-5 w-5 flex-none text-brand-amber" />
      <div className="flex-1">
        <p className="text-sm font-semibold">Activate a plan to {feature}</p>
        <p className="text-xs text-foreground/60">This is only available to members with an active plan.</p>
      </div>
      <Link href="/plans" className="flex-none rounded-lg bg-brand-amber px-3 py-1.5 text-xs font-bold text-[#3a2c00]">
        View plans
      </Link>
    </Card>
  );
}

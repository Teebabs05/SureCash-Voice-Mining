import Link from "next/link";
import { Crown, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";

/** Banner shown when a feature is blocked by plan status - either the user
 * has no plan at all (and one is required), or their current plan doesn't
 * include this specific feature. Distinct copy/color so it's clear which
 * one applies and what to do about it. */
export function PlanGateBanner({
  reason,
  feature,
}: {
  reason: "no_plan" | "plan_restricted";
  feature: string;
}) {
  if (reason === "plan_restricted") {
    return (
      <Card className="flex items-center gap-3 border border-brand-primary/30 bg-brand-primary/10 p-4">
        <Lock className="h-5 w-5 flex-none text-brand-primary" />
        <div className="flex-1">
          <p className="text-sm font-semibold">Upgrade your plan to {feature}</p>
          <p className="text-xs text-foreground/60">Your current plan doesn&apos;t include this feature.</p>
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

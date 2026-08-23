import Link from "next/link";
import { Rocket, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

/** Full-page takeover shown in place of an activity's normal content when
 * the user has no active plan at all and one is required - distinct from
 * the smaller PlanGateBanner used for the "used up today's quota" case,
 * which still shows the activity underneath. */
export function PlanLockScreen({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Card className="flex flex-col items-center px-6 py-10 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-brand text-white shadow-lg shadow-brand-primary/30">
        <Icon className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-lg font-bold">{title} is a premium feature</h2>
      <p className="mt-2 text-sm text-foreground/60">{description}</p>
      <Link
        href="/plans"
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl gradient-brand text-sm font-bold text-white"
      >
        <Rocket className="h-4 w-4" /> Upgrade to unlock
      </Link>
      <Link
        href="/earn"
        className="mt-2.5 flex h-12 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground"
      >
        Back to earning
      </Link>
    </Card>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, Coins, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency, cn } from "@/lib/utils";

interface MiningPlan {
  id: string;
  name: string;
  price: string;
  dailyReturn: string;
  durationDays: number;
  description: string | null;
}

interface Investment {
  id: string;
  planId: string;
  plan: { name: string };
  amountInvested: string;
  totalEarned: string;
  startedAt: string;
  nextPayoutAt: string;
  endsAt: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
}

export default function MiningPlansPage() {
  const [plans, setPlans] = useState<MiningPlan[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [investingId, setInvestingId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(() => {
    apiFetch<{ plans: MiningPlan[]; investments: Investment[] }>("/api/mining-plans")
      .then((res) => {
        setPlans(res.plans);
        setInvestments(res.investments);
        setNow(Date.now());
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function invest(plan: MiningPlan) {
    if (!confirm(`Invest ${formatCurrency(plan.price)} in ${plan.name}? You'll earn ${formatCurrency(plan.dailyReturn)}/day for ${plan.durationDays} days.`)) {
      return;
    }
    setInvestingId(plan.id);
    try {
      await apiFetch(`/api/mining-plans/${plan.id}/invest`, { method: "POST" });
      toast.success(`Invested in ${plan.name}!`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not invest");
    } finally {
      setInvestingId(null);
    }
  }

  if (loading) return <p className="py-10 text-center text-sm text-foreground/50">Loading mining plans…</p>;

  const activeInvestments = investments.filter((i) => i.status === "ACTIVE");
  const pastInvestments = investments.filter((i) => i.status !== "ACTIVE");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Mining Plans</h1>
        <p className="text-sm text-foreground/60">
          Invest once, earn a fixed daily return automatically for the plan&apos;s duration.
        </p>
      </div>

      {activeInvestments.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-foreground/70">My active investments</p>
          {activeInvestments.map((inv) => {
            const totalDays = Math.round(
              (new Date(inv.endsAt).getTime() - new Date(inv.startedAt).getTime()) / (24 * 60 * 60 * 1000)
            );
            const daysElapsed = Math.min(
              totalDays,
              Math.max(0, Math.round((now - new Date(inv.startedAt).getTime()) / (24 * 60 * 60 * 1000)))
            );
            const percent = totalDays > 0 ? Math.min(100, Math.round((daysElapsed / totalDays) * 100)) : 0;

            return (
              <Card key={inv.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-brand-primary/15 p-2.5 text-brand-primary">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold">{inv.plan.name}</p>
                      <p className="text-xs text-foreground/50">
                        Invested {formatCurrency(inv.amountInvested)} · Day {daysElapsed}/{totalDays}
                      </p>
                    </div>
                  </div>
                  <span className="whitespace-nowrap text-sm font-bold text-brand-green">
                    +{formatCurrency(inv.totalEarned)}
                  </span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div className="h-full rounded-full bg-brand-primary" style={{ width: `${percent}%` }} />
                </div>
                <p className="mt-2 flex items-center gap-1 text-xs text-foreground/50">
                  <Clock className="h-3 w-3" /> Next payout {new Date(inv.nextPayoutAt).toLocaleString()}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-foreground/70">Available plans</p>
        {plans.length === 0 && (
          <p className="py-6 text-center text-sm text-foreground/50">No mining plans available right now.</p>
        )}
        {plans.map((plan) => {
          const totalReturn = Number(plan.dailyReturn) * plan.durationDays;
          return (
            <Card key={plan.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-brand-amber/15 p-2.5 text-[#a67c00]">
                    <Coins className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    <p className="text-xs text-foreground/50">{plan.durationDays}-day plan</p>
                  </div>
                </div>
                <p className="text-lg font-bold">{formatCurrency(plan.price)}</p>
              </div>
              {plan.description && <p className="text-xs text-foreground/60">{plan.description}</p>}
              <div className="flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2 text-xs">
                <span className="text-foreground/60">
                  {formatCurrency(plan.dailyReturn)}/day · up to {formatCurrency(totalReturn)} total
                </span>
              </div>
              <Button loading={investingId === plan.id} onClick={() => invest(plan)}>
                Invest {formatCurrency(plan.price)}
              </Button>
            </Card>
          );
        })}
      </div>

      {pastInvestments.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-foreground/70">History</p>
          {pastInvestments.map((inv) => (
            <div key={inv.id} className="card flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-2">
                {inv.status === "COMPLETED" ? (
                  <CheckCircle2 className="h-4 w-4 text-brand-green" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium">{inv.plan.name}</p>
                  <p className={cn("text-xs", inv.status === "COMPLETED" ? "text-brand-green" : "text-red-500")}>
                    {inv.status === "COMPLETED" ? "Completed" : "Cancelled"}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-foreground/60">+{formatCurrency(inv.totalEarned)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

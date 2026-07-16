"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet as WalletIcon } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  price: string;
  voiceSessionReward: string;
  wordGameReward: string;
  sponsoredPostReward: string;
  taskReward: string;
  referralCommission: string;
}

interface WalletEntry {
  type: string;
  balance: string;
}

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [depositBalance, setDepositBalance] = useState("0");
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<{ plans: Plan[]; currentPlanId: string | null }>("/api/plans").then((res) => {
      setPlans(res.plans);
      setCurrentPlanId(res.currentPlanId);
    });
    apiFetch<{ wallets: WalletEntry[] }>("/api/wallet")
      .then((res) => setDepositBalance(res.wallets.find((w) => w.type === "MAIN")?.balance ?? "0"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function activate(plan: Plan) {
    setActivatingId(plan.id);
    try {
      await apiFetch("/api/plans/activate", { method: "POST", body: JSON.stringify({ planId: plan.id }) });
      toast.success(`${plan.name} activated!`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not activate plan");
    } finally {
      setActivatingId(null);
    }
  }

  if (loading) return <p className="py-10 text-center text-sm text-foreground/50">Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-foreground/60">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div>
        <h1 className="text-xl font-bold">Plans & Pricing</h1>
        <p className="text-sm text-foreground/60">Activate instantly with your deposit balance</p>
      </div>

      <div className="card gradient-brand p-5 text-white">
        <p className="text-xs text-white/75">Your deposit balance</p>
        <p className="text-2xl font-bold">{formatCurrency(depositBalance)}</p>
        <Link href="/wallet/deposit">
          <Button variant="secondary" size="sm" className="mt-3">
            <WalletIcon className="h-4 w-4" /> Fund wallet
          </Button>
        </Link>
      </div>

      <p className="text-center text-xs text-foreground/50">
        Every plan is a one-time <span className="font-semibold">Lifetime activation</span> - pay once, earn forever.
      </p>

      <div className="flex flex-col gap-4">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          return (
            <Card key={plan.id} className={isCurrent ? "border-2 border-brand-green" : ""}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">{plan.name}</p>
                  <p className="text-2xl font-bold text-brand-purple">{formatCurrency(plan.price)}</p>
                  <p className="text-xs text-foreground/50">Lifetime access</p>
                </div>
                {isCurrent && (
                  <span className="rounded-full bg-brand-green/15 px-2 py-1 text-xs font-semibold text-brand-green">
                    ACTIVE
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3 text-sm">
                <Row label="per Voice Earn session" value={plan.voiceSessionReward} />
                <Row label="per Word Game" value={plan.wordGameReward} />
                <Row label="per Sponsored Post" value={plan.sponsoredPostReward} />
                <Row label="per task" value={plan.taskReward} />
                <Row label="per activated sale" value={plan.referralCommission} />
              </div>

              <div className="mt-3">
                {isCurrent ? (
                  <Button className="w-full" disabled>
                    Your current plan
                  </Button>
                ) : (
                  <Button className="w-full" loading={activatingId === plan.id} onClick={() => activate(plan)}>
                    Deposit {formatCurrency(plan.price)} to activate
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground/60">{label}</span>
      <span className="font-semibold text-brand-green">{formatCurrency(value)}</span>
    </div>
  );
}

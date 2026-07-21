"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Wallet as WalletIcon,
  Mic,
  Star,
  Award,
  Crown,
  Sparkles,
  Gamepad2,
  Flag,
  CheckSquare,
  Users,
  CheckCircle2,
  PlusCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  price: string;
  voiceSessionReward: string;
  wordGameReward: string;
  sponsoredPostReward: string;
  taskReward: string;
  referralCommission: string;
  isPopular: boolean;
  voiceEarnDailyLimit: number;
  wordGameDailyLimit: number;
  taskCenterDailyLimit: number;
  sponsoredPostsDailyLimit: number;
}

const UNLIMITED_THRESHOLD = 9999;

interface WalletEntry {
  type: string;
  balance: string;
}

const TIER_ICONS = [Mic, Star, Award, Crown, Crown, Sparkles];

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

      <div className="gradient-wallet-main relative overflow-hidden rounded-3xl p-5 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full bg-white/10 blur-md" />
        <div className="pointer-events-none absolute -right-16 top-16 h-24 w-24 rounded-full bg-white/10 blur-md" />
        <WalletIcon className="pointer-events-none absolute -bottom-2 right-4 h-20 w-20 text-white/10" />
        <p className="text-xs text-white/70">Your deposit balance</p>
        <p className="mt-1 text-3xl font-bold">{formatCurrency(depositBalance)}</p>
        <Link href="/wallet/deposit">
          <button className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-primary">
            <PlusCircle className="h-4 w-4" /> Fund wallet
          </button>
        </Link>
      </div>

      <p className="text-center text-xs text-foreground/50">
        Every plan is a one-time <span className="font-semibold text-foreground/70">Lifetime</span> activation - pay
        once, earn forever.
      </p>

      <div className="flex flex-col gap-5">
        {plans.map((plan, i) => {
          const isCurrent = plan.id === currentPlanId;
          const Icon = TIER_ICONS[i % TIER_ICONS.length];
          return (
            <div
              key={plan.id}
              className={`overflow-hidden rounded-3xl shadow-lg ${
                isCurrent ? "ring-2 ring-brand-green" : plan.isPopular ? "ring-2 ring-brand-primary" : "ring-1 ring-border"
              }`}
            >
              <div className={`relative overflow-hidden p-5 text-white ${plan.isPopular ? "gradient-brand" : "gradient-plan-dark"}`}>
                <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-md" />

                <div className="relative flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                    <Icon className="h-5 w-5" />
                  </div>
                  {isCurrent ? (
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-green">
                      Active
                    </span>
                  ) : plan.isPopular ? (
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-primary">
                      Popular
                    </span>
                  ) : null}
                </div>

                <p className="relative mt-4 text-lg font-bold">{plan.name}</p>
                <p className="relative mt-1 text-3xl font-extrabold tracking-tight">{formatCurrency(plan.price)}</p>
                <span className="relative mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold ring-1 ring-white/20">
                  <Sparkles className="h-3 w-3" /> Lifetime access
                </span>
              </div>

              <div className="flex flex-col bg-surface p-5">
                <div className="flex flex-col divide-y divide-dashed divide-border">
                  <RateRow
                    icon={Mic}
                    color="primary"
                    amount={plan.voiceSessionReward}
                    label="per Voice Earn session"
                    dailyLimit={plan.voiceEarnDailyLimit}
                  />
                  <RateRow
                    icon={Gamepad2}
                    color="primary"
                    amount={plan.wordGameReward}
                    label="per Word Game"
                    dailyLimit={plan.wordGameDailyLimit}
                  />
                  <RateRow
                    icon={Flag}
                    color="amber"
                    amount={plan.sponsoredPostReward}
                    label="per Sponsored Post"
                    dailyLimit={plan.sponsoredPostsDailyLimit}
                  />
                  <RateRow
                    icon={CheckSquare}
                    color="amber"
                    amount={plan.taskReward}
                    label="per task"
                    dailyLimit={plan.taskCenterDailyLimit}
                  />
                  <RateRow icon={Users} color="green" amount={plan.referralCommission} label="per activated sale" />
                </div>

                <div className="mt-4">
                  {isCurrent ? (
                    <div className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-green/15 text-sm font-bold text-brand-green">
                      <CheckCircle2 className="h-4 w-4" /> Your current plan
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      variant="secondary"
                      loading={activatingId === plan.id}
                      onClick={() => activate(plan)}
                    >
                      <PlusCircle className="h-4 w-4" /> Deposit {formatCurrency(plan.price)} to activate
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RateRow({
  icon: Icon,
  color,
  amount,
  label,
  dailyLimit,
}: {
  icon: LucideIcon;
  color: "primary" | "amber" | "green";
  amount: string;
  label: string;
  dailyLimit?: number;
}) {
  const colorClass = {
    primary: "bg-brand-primary/15 text-brand-primary",
    amber: "bg-brand-amber/15 text-[#a67c00]",
    green: "bg-brand-green/15 text-brand-green",
  }[color];

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="font-bold text-foreground">{formatCurrency(amount)}</span>
      <span className="text-sm text-foreground/50">{label}</span>
      {dailyLimit !== undefined && (
        <span className="ml-auto text-xs font-semibold text-foreground/40">
          {dailyLimit >= UNLIMITED_THRESHOLD ? "Unlimited" : `up to ${dailyLimit}/day`}
        </span>
      )}
    </div>
  );
}

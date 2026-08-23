"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Gift } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlanLockScreen } from "@/components/plan-lock-screen";
import { PlanGateBanner } from "@/components/plan-gate-banner";

interface SpinReward {
  id: string;
  label: string;
  amount: string;
  colorHex: string;
}

interface SpinHistoryEntry {
  id: string;
  label: string;
  amount: string;
  createdAt: string;
}

export default function SpinPage() {
  const [rewards, setRewards] = useState<SpinReward[]>([]);
  const [planRequired, setPlanRequired] = useState(false);
  const [sectionDailyLimit, setSectionDailyLimit] = useState<number | null>(null);
  const [sectionCompletedToday, setSectionCompletedToday] = useState(0);
  const [canSpin, setCanSpin] = useState(false);
  const [extraSpinPrice, setExtraSpinPrice] = useState(50);
  const [history, setHistory] = useState<SpinHistoryEntry[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const wheelRef = useRef<HTMLDivElement>(null);

  function load() {
    return apiFetch<{
      planRequired: boolean;
      sectionDailyLimit: number | null;
      sectionCompletedToday: number;
      rewards: SpinReward[];
      canSpin: boolean;
      extraSpinPrice: number;
      history: SpinHistoryEntry[];
    }>("/api/spin").then((res) => {
      setPlanRequired(res.planRequired);
      setSectionDailyLimit(res.sectionDailyLimit);
      setSectionCompletedToday(res.sectionCompletedToday);
      setRewards(res.rewards);
      setCanSpin(res.canSpin);
      setExtraSpinPrice(res.extraSpinPrice);
      setHistory(res.history);
    });
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function spin() {
    if (spinning || rewards.length === 0) return;
    setSpinning(true);
    try {
      const res = await apiFetch<{ reward: SpinReward; paid: boolean; pricePaid: number }>("/api/spin", {
        method: "POST",
      });
      const index = rewards.findIndex((r) => r.id === res.reward.id);
      const segmentAngle = 360 / rewards.length;
      const targetAngle = rotation + 360 * 5 + (360 - index * segmentAngle - segmentAngle / 2) - (rotation % 360);
      setRotation(targetAngle);

      setTimeout(() => {
        toast.success(
          Number(res.reward.amount) > 0
            ? `You won ${formatCurrency(res.reward.amount)}!`
            : `You landed on: ${res.reward.label}`
        );
        load();
        setSpinning(false);
      }, 3200);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not spin");
      setSpinning(false);
    }
  }

  const segmentAngle = rewards.length ? 360 / rewards.length : 0;
  const limitReached = sectionDailyLimit !== null && sectionCompletedToday >= sectionDailyLimit;

  if (loading) return <p className="py-10 text-center text-sm text-foreground/50">Loading spin wheel…</p>;

  if (planRequired) {
    return (
      <div className="flex flex-col gap-4 py-6">
        <h1 className="text-center text-xl font-bold">Daily Spin Wheel</h1>
        <PlanLockScreen
          icon={Gift}
          title="Lucky Spin"
          description="Spin daily for a chance at instant cash prizes. Activate a plan to start spinning and winning."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      <div>
        <h1 className="text-center text-xl font-bold">Daily Spin Wheel</h1>
        <p className="text-center text-sm text-foreground/60">One free spin every day</p>
      </div>

      <div className="relative mx-auto h-72 w-72">
        <div className="absolute left-1/2 top-0 z-10 h-4 w-4 -translate-x-1/2 rotate-45 gradient-gold" />
        <div
          ref={wheelRef}
          className="h-full w-full rounded-full border-4 border-brand-amber shadow-xl transition-transform"
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionDuration: spinning ? "3.2s" : "0s",
            transitionTimingFunction: "cubic-bezier(0.17, 0.67, 0.3, 1)",
            background: `conic-gradient(${rewards
              .map((r, i) => `${r.colorHex} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`)
              .join(", ")})`,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-brand text-white shadow-lg">
            <Gift className="h-6 w-6" />
          </div>
        </div>
      </div>

      {limitReached && (
        <div className="mx-auto w-full max-w-xs">
          <PlanGateBanner reason="limit_reached" feature="spin" dailyLimit={sectionDailyLimit ?? undefined} />
        </div>
      )}

      {!limitReached && (canSpin ? (
        <Button size="lg" className="mx-auto w-full max-w-xs" loading={spinning} onClick={spin}>
          Spin now
        </Button>
      ) : (
        <div className="mx-auto flex w-full max-w-xs flex-col gap-3">
          <Card className="border border-brand-primary/20 bg-brand-primary/5 text-center text-sm text-foreground/70">
            You&apos;ve used today&apos;s free spin. Buy an extra spin from your wallet balance to keep playing.
          </Card>
          <Button size="lg" loading={spinning} onClick={spin}>
            Buy Extra Spin ({formatCurrency(extraSpinPrice)})
          </Button>
        </div>
      ))}

      <div className="mx-auto grid w-full max-w-xs grid-cols-2 gap-2">
        {rewards.map((r) => (
          <div key={r.id} className="flex items-center gap-2 rounded-lg bg-surface-muted px-2 py-1.5 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.colorHex }} />
            {r.label}
          </div>
        ))}
      </div>

      <Card className="mx-auto w-full max-w-md">
        <h2 className="mb-3 text-base font-semibold">Spin History</h2>
        {history.length === 0 ? (
          <p className="py-6 text-center text-sm text-foreground/50">No spins yet</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                <span className="font-medium">{h.label}</span>
                <span className={Number(h.amount) > 0 ? "font-semibold text-brand-green" : "text-foreground/40"}>
                  {Number(h.amount) > 0 ? `+${formatCurrency(h.amount)}` : "No reward"}
                </span>
                <span className="text-xs text-foreground/50">{new Date(h.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

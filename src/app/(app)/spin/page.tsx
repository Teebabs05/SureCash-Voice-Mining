"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Gift } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SpinReward {
  id: string;
  label: string;
  amount: string;
  colorHex: string;
}

export default function SpinPage() {
  const [rewards, setRewards] = useState<SpinReward[]>([]);
  const [canSpin, setCanSpin] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<{ rewards: SpinReward[]; canSpin: boolean }>("/api/spin").then((res) => {
      setRewards(res.rewards);
      setCanSpin(res.canSpin);
    });
  }, []);

  async function spin() {
    if (!canSpin || spinning || rewards.length === 0) return;
    setSpinning(true);
    try {
      const res = await apiFetch<{ reward: SpinReward }>("/api/spin", { method: "POST" });
      const index = rewards.findIndex((r) => r.id === res.reward.id);
      const segmentAngle = 360 / rewards.length;
      const targetAngle = 360 * 5 + (360 - index * segmentAngle - segmentAngle / 2);
      setRotation(targetAngle);

      setTimeout(() => {
        toast.success(
          Number(res.reward.amount) > 0
            ? `You won ${formatCurrency(res.reward.amount)}!`
            : `You landed on: ${res.reward.label}`
        );
        setCanSpin(false);
        setSpinning(false);
      }, 3200);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not spin");
      setSpinning(false);
    }
  }

  const segmentAngle = rewards.length ? 360 / rewards.length : 0;

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div>
        <h1 className="text-center text-xl font-bold">Lucky Spin</h1>
        <p className="text-center text-sm text-foreground/60">One free spin every day</p>
      </div>

      <div className="relative h-72 w-72">
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

      <Button size="lg" className="w-full max-w-xs" loading={spinning} disabled={!canSpin} onClick={spin}>
        {canSpin ? "Spin now" : "Come back tomorrow"}
      </Button>

      <div className="grid w-full max-w-xs grid-cols-2 gap-2">
        {rewards.map((r) => (
          <div key={r.id} className="flex items-center gap-2 rounded-lg bg-surface-muted px-2 py-1.5 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.colorHex }} />
            {r.label}
          </div>
        ))}
      </div>
    </div>
  );
}

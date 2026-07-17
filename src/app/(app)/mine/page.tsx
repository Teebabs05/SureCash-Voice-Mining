"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Pickaxe, Flame, Crown } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface MiningStatus {
  canMine: boolean;
  planRequired: boolean;
  nextAvailableAt: string | null;
  streakCount: number;
  longestStreak: number;
  projectedReward: number;
}

function msRemaining(target: string) {
  return Math.max(0, new Date(target).getTime() - Date.now());
}

function useCountdown(target: string | null) {
  const [remaining, setRemaining] = useState(() => (target ? msRemaining(target) : 0));

  useEffect(() => {
    // Sync immediately on target change, then keep ticking every second.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemaining(target ? msRemaining(target) : 0);
    if (!target) return;
    const id = setInterval(() => setRemaining(msRemaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return remaining;
}

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function MinePage() {
  const [status, setStatus] = useState<MiningStatus | null>(null);
  const [mining, setMining] = useState(false);
  const remaining = useCountdown(status?.canMine ? null : status?.nextAvailableAt ?? null);

  const load = useCallback(() => {
    apiFetch<MiningStatus>("/api/mining/status").then(setStatus);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (status && !status.canMine && remaining === 0) load();
  }, [remaining, status, load]);

  async function onMine() {
    if (!status?.canMine || mining) return;
    setMining(true);
    try {
      const res = await apiFetch<{ reward: number; milestoneBonus: number; streak: number }>(
        "/api/mining/claim",
        { method: "POST" }
      );
      await new Promise((r) => setTimeout(r, 1400));
      toast.success(`+${formatCurrency(res.reward)} mined! Streak day ${res.streak} 🔥`);
      if (res.milestoneBonus > 0) {
        toast.success(`🎉 Streak milestone! +${formatCurrency(res.milestoneBonus)} bonus`);
      }
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Mining failed");
    } finally {
      setMining(false);
    }
  }

  if (!status) return <p className="py-10 text-center text-sm text-foreground/50">Loading…</p>;

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      {status.planRequired && (
        <Card className="flex w-full items-center gap-3 border border-brand-amber/30 bg-brand-amber/10 p-4">
          <Crown className="h-5 w-5 flex-none text-brand-amber" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Activate a plan to start mining</p>
            <p className="text-xs text-foreground/60">Daily mining is only available to members with an active plan.</p>
          </div>
          <Link href="/plans" className="flex-none rounded-lg bg-brand-amber px-3 py-1.5 text-xs font-bold text-[#3a2c00]">
            View plans
          </Link>
        </Card>
      )}

      <div className="flex items-center gap-2 rounded-full bg-surface-muted px-4 py-1.5">
        <Flame className="h-4 w-4 text-orange-500" />
        <span className="text-sm font-semibold">{status.streakCount}-day streak</span>
      </div>

      <div className="relative flex h-56 w-56 items-center justify-center">
        <div
          className={cn(
            "absolute inset-0 rounded-full gradient-brand opacity-20",
            status.canMine && !status.planRequired && "animate-pulse-glow"
          )}
        />
        <button
          onClick={onMine}
          disabled={!status.canMine || mining || status.planRequired}
          className={cn(
            "relative flex h-44 w-44 items-center justify-center rounded-full gradient-brand text-white shadow-2xl transition-transform active:scale-95 disabled:opacity-70",
            mining && "animate-pulse-glow"
          )}
        >
          <Pickaxe className={cn("h-16 w-16", mining && "animate-spin-slow")} />
        </button>
      </div>

      <div className="text-center">
        {status.canMine ? (
          <>
            <p className="text-lg font-semibold">Tap to mine</p>
            <p className="text-sm text-foreground/60">
              Earn up to {formatCurrency(status.projectedReward)} today
            </p>
          </>
        ) : (
          <>
            <p className="text-lg font-semibold">Next mine in</p>
            <p className="text-2xl font-mono font-bold text-brand-primary">{formatDuration(remaining)}</p>
          </>
        )}
      </div>

      <Card className="w-full">
        <div className="grid grid-cols-2 divide-x divide-border text-center">
          <div className="pr-3">
            <p className="text-xs text-foreground/50">Current streak</p>
            <p className="text-lg font-bold">{status.streakCount} days</p>
          </div>
          <div className="pl-3">
            <p className="text-xs text-foreground/50">Longest streak</p>
            <p className="text-lg font-bold">{status.longestStreak} days</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

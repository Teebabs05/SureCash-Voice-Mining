"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { PlayCircle, Tv, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlanGateBanner } from "@/components/plan-gate-banner";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

interface AdsStatus {
  planRequired: boolean;
  rewardAmount: number;
  durationSeconds: number;
  sectionDailyLimit: number | null;
  sectionCompletedToday: number;
  limitReached: boolean;
}

export default function WatchAdsPage() {
  const [status, setStatus] = useState<AdsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [watching, setWatching] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(() => {
    apiFetch<AdsStatus>("/api/ads")
      .then(setStatus)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [load]);

  function startWatching() {
    if (!status) return;
    setWatching(true);
    setSecondsLeft(status.durationSeconds);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1 && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return Math.max(0, s - 1);
      });
    }, 1000);
  }

  async function claim() {
    if (!status) return;
    setClaiming(true);
    try {
      const res = await apiFetch<{ reward: number }>("/api/ads/watch", {
        method: "POST",
        body: JSON.stringify({ watchedSeconds: status.durationSeconds }),
      });
      toast.success(res.reward > 0 ? `+${formatCurrency(res.reward)} added to your Engagement wallet` : "Ad watched!");
      setWatching(false);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not claim reward");
    } finally {
      setClaiming(false);
    }
  }

  if (loading || !status) return <p className="py-10 text-center text-sm text-foreground/50">Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Watch Ads to Earn</h1>
        <p className="text-sm text-foreground/60">
          Watch a short ad to earn {formatCurrency(status.rewardAmount)}
          {status.sectionDailyLimit !== null ? `, up to ${status.sectionDailyLimit} times a day` : ""}.
        </p>
      </div>

      {status.planRequired && <PlanGateBanner reason="free_trial" feature="watching ads" />}
      {!status.planRequired && status.limitReached && (
        <PlanGateBanner reason="limit_reached" feature="watch ads" dailyLimit={status.sectionDailyLimit ?? undefined} />
      )}

      {!status.limitReached && (
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          {!watching ? (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary">
                <Tv className="h-7 w-7" />
              </div>
              <p className="font-semibold">Ready to watch</p>
              <p className="text-xs text-foreground/50">
                {status.sectionCompletedToday}
                {status.sectionDailyLimit !== null ? `/${status.sectionDailyLimit}` : ""} watched today
              </p>
              <Button onClick={startWatching}>
                <PlayCircle className="h-4 w-4" /> Watch ad ({status.durationSeconds}s)
              </Button>
            </>
          ) : secondsLeft > 0 ? (
            <>
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-surface-muted text-3xl font-bold text-brand-primary">
                {secondsLeft}
              </div>
              <p className="text-sm text-foreground/60">Watching ad… don&apos;t close this page</p>
              <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-brand-primary transition-all"
                  style={{ width: `${((status.durationSeconds - secondsLeft) / status.durationSeconds) * 100}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/15 text-brand-green">
                <PartyPopper className="h-7 w-7" />
              </div>
              <p className="font-semibold">Ad complete!</p>
              <Button loading={claiming} onClick={claim}>
                Claim {formatCurrency(status.rewardAmount)}
              </Button>
            </>
          )}
        </Card>
      )}
    </div>
  );
}

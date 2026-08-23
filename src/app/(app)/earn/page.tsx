"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pickaxe, Mic, ClipboardCheck, Camera, BookOpen, Disc3, ChevronRight, Crown, Lock, TrendingUp, Tv } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

interface MiningStatus {
  canMine: boolean;
}

const LOCKED_WHEN_NO_PLAN = new Set(["voice", "wordgame", "spin"]);

interface VoiceTask {
  completedToday: number;
  dailyLimit: number;
}

interface TaskCenterTask {
  isCompleted: boolean;
}

const WAYS = [
  {
    key: "mine",
    href: "/mine",
    title: "Daily Mining",
    description: "Claim your free daily reward and build a streak",
    icon: Pickaxe,
    iconClass: "bg-brand-primary/15 text-brand-primary",
  },
  {
    key: "miningplans",
    href: "/mining-plans",
    title: "Mining Plans",
    description: "Invest once, earn a fixed return every day",
    icon: TrendingUp,
    iconClass: "bg-brand-green/15 text-brand-green",
  },
  {
    key: "voice",
    href: "/voice",
    title: "Voice Earn",
    description: "Read sentences aloud, word by word",
    icon: Mic,
    iconClass: "bg-brand-primary/15 text-brand-primary",
  },
  {
    key: "wordgame",
    href: "/word-game",
    title: "Word Game",
    description: "No timer, no pressure - just say it right",
    icon: BookOpen,
    iconClass: "bg-brand-green/15 text-brand-green",
  },
  {
    key: "tasks",
    href: "/tasks",
    title: "Tasks",
    description: "Complete simple tasks to earn",
    icon: ClipboardCheck,
    iconClass: "bg-brand-amber/15 text-[#a67c00]",
  },
  {
    key: "sponsored",
    href: "/tasks/sponsored",
    title: "Sponsored Posts",
    description: "Share posts on social media",
    icon: Camera,
    iconClass: "bg-red-500/15 text-red-500",
  },
  {
    key: "spin",
    href: "/spin",
    title: "Lucky Spin",
    description: "One free spin daily, buy more to keep playing",
    icon: Disc3,
    iconClass: "bg-brand-amber/15 text-[#a67c00]",
  },
  {
    key: "watchads",
    href: "/watch-ads",
    title: "Watch Ads",
    description: "Watch a short ad, get paid instantly",
    icon: Tv,
    iconClass: "bg-brand-primary/15 text-brand-primary",
  },
] as const;

export default function EarnPage() {
  const [status, setStatus] = useState<Record<string, string>>({});
  const [planRequired, setPlanRequired] = useState(false);

  useEffect(() => {
    apiFetch<{ planRequired: boolean }>("/api/dashboard")
      .then((res) => setPlanRequired(res.planRequired))
      .catch(() => {});
    apiFetch<MiningStatus>("/api/mining/status")
      .then((res) => setStatus((s) => ({ ...s, mine: res.canMine ? "Ready" : "Claimed" })))
      .catch(() => {});
    apiFetch<{ languages: { limitReached: boolean }[] }>("/api/voice/tasks?category=session")
      .then((res) => {
        const anyReady = res.languages.some((l) => !l.limitReached);
        setStatus((s) => ({ ...s, voice: anyReady ? "Ready" : "All done" }));
      })
      .catch(() => {});
    apiFetch<{ tasks: VoiceTask[] }>("/api/voice/tasks?category=word_game")
      .then((res) => {
        const remaining = res.tasks.reduce((sum, t) => sum + Math.max(t.dailyLimit - t.completedToday, 0), 0);
        setStatus((s) => ({ ...s, wordgame: remaining > 0 ? "Ready" : "All done" }));
      })
      .catch(() => {});
    apiFetch<{ tasks: TaskCenterTask[] }>("/api/tasks")
      .then((res) => {
        const available = res.tasks.filter((t) => !t.isCompleted).length;
        setStatus((s) => ({ ...s, tasks: available > 0 ? `${available} available` : "All done" }));
      })
      .catch(() => {});
    apiFetch<{ platforms: { status: string }[] }>("/api/sponsored-posts")
      .then((res) => {
        const available = res.platforms.filter((p) => p.status === "AVAILABLE").length;
        setStatus((s) => ({ ...s, sponsored: available > 0 ? `${available} available` : "All done" }));
      })
      .catch(() => {});
    apiFetch<{ canSpin: boolean }>("/api/spin")
      .then((res) => setStatus((s) => ({ ...s, spin: res.canSpin ? "Ready" : "Claimed" })))
      .catch(() => {});
    apiFetch<{ limitReached: boolean }>("/api/ads")
      .then((res) => setStatus((s) => ({ ...s, watchads: res.limitReached ? "All done" : "Ready" })))
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Ways to Earn</h1>
        <p className="text-sm text-foreground/60">Choose an activity</p>
      </div>

      {planRequired ? (
        <Card className="flex flex-col items-center gap-2 bg-brand-primary/10 text-center">
          <p className="font-bold text-brand-primary">Activate a plan to start earning</p>
          <p className="text-sm text-foreground/60">You need an active plan to access earning features</p>
          <Link href="/plans" className="mt-1 w-full max-w-56">
            <Button className="w-full">View Plans</Button>
          </Link>
        </Card>
      ) : (
        <Link href="/plans">
          <Card className="flex items-center justify-between gap-3 gradient-brand text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/15 p-2.5">
                <Crown className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold">Move to a higher plan</p>
                <p className="text-xs text-white/80">Bigger rewards per session, task & referral</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Card>
        </Link>
      )}

      <div className="flex flex-col gap-3">
        {WAYS.map(({ key, href, title, description, icon: Icon, iconClass }) => {
          const locked = planRequired && LOCKED_WHEN_NO_PLAN.has(key);
          return (
            <Link key={key} href={href}>
              <Card className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2.5 ${iconClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-xs text-foreground/50">{description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {locked ? (
                    <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-brand-primary/15 px-2 py-0.5 text-xs font-semibold text-brand-primary">
                      <Lock className="h-3 w-3" /> Locked
                    </span>
                  ) : (
                    status[key] && (
                      <span
                        className={
                          status[key] === "Ready" || status[key].includes("available")
                            ? "whitespace-nowrap rounded-full bg-brand-green/15 px-2 py-0.5 text-xs font-semibold text-brand-green"
                            : "whitespace-nowrap rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-foreground/50"
                        }
                      >
                        {status[key]}
                      </span>
                    )
                  )}
                  <ChevronRight className="h-4 w-4 text-foreground/30" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

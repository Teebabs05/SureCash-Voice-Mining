"use client";

import { useEffect, useState } from "react";
import { Trophy, Flame, Users } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface LeaderboardData {
  topEarners: { id: string; fullName: string; level: number; xp: number }[];
  topMiners: { id: string; fullName: string; level: number; streakCount: number }[];
  topReferrers: { fullName: string; level: number; referralCount: number }[];
}

const TABS = [
  { key: "topEarners", label: "Top Earners", icon: Trophy },
  { key: "topMiners", label: "Top Miners", icon: Flame },
  { key: "topReferrers", label: "Top Referrers", icon: Users },
] as const;

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("topEarners");

  useEffect(() => {
    apiFetch<LeaderboardData>("/api/leaderboard").then(setData);
  }, []);

  if (!data) return <p className="py-10 text-center text-sm text-foreground/50">Loading…</p>;

  const rows = data[tab];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Leaderboard</h1>

      <div className="flex gap-2 rounded-xl bg-surface-muted p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium transition-colors",
              tab === key ? "bg-surface shadow" : "text-foreground/50"
            )}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      <div className="card divide-y divide-border p-0">
        {rows.length === 0 && <p className="p-6 text-center text-sm text-foreground/50">No data yet</p>}
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                i === 0 && "gradient-gold text-[#3a2c00]",
                i === 1 && "bg-slate-300 text-slate-700",
                i === 2 && "bg-orange-300 text-orange-800",
                i > 2 && "bg-surface-muted text-foreground/50"
              )}
            >
              {i + 1}
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">{row.fullName}</p>
              <p className="text-xs text-foreground/50">Level {row.level}</p>
            </div>
            <span className="text-sm font-bold text-brand-primary">
              {"xp" in row && `${row.xp} XP`}
              {"streakCount" in row && `${row.streakCount}🔥`}
              {"referralCount" in row && `${row.referralCount} invites`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";

interface Analytics {
  conversionRate: { emailVerifiedPercent: number; depositedPercent: number };
  retention: { d7ActivePercent: number | null; eligibleUsers: number };
  mostActiveUsers: { id: string; fullName: string; level: number; transactionCount: number }[];
  voice: {
    allTime: { approved: number; rejected: number; flagged: number; total: number; successRatePercent: number | null };
    today: { approved: number; rejected: number; flagged: number; total: number; successRatePercent: number | null };
  };
}

function StatBlock({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <p className="text-xs text-foreground/50">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="text-[10px] text-foreground/40">{sub}</p>}
    </Card>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    apiFetch<Analytics>("/api/admin/analytics").then(setData);
  }, []);

  if (!data) return <p className="text-sm text-foreground/50">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBlock
          label="7-day retention"
          value={data.retention.d7ActivePercent === null ? "—" : `${data.retention.d7ActivePercent}%`}
          sub={`of ${data.retention.eligibleUsers} eligible users`}
        />
        <StatBlock label="Email verification rate" value={`${data.conversionRate.emailVerifiedPercent}%`} />
        <StatBlock label="Deposited at least once" value={`${data.conversionRate.depositedPercent}%`} />
        <StatBlock
          label="Voice success rate (all-time)"
          value={data.voice.allTime.successRatePercent === null ? "—" : `${data.voice.allTime.successRatePercent}%`}
          sub={`${data.voice.allTime.approved} approved / ${data.voice.allTime.total} reviewed`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Voice AI today</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-brand-green">{data.voice.today.approved}</p>
            <p className="text-xs text-foreground/50">Approved</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-500">{data.voice.today.rejected}</p>
            <p className="text-xs text-foreground/50">Rejected</p>
          </div>
          <div>
            <p className="text-lg font-bold text-brand-gold">{data.voice.today.flagged}</p>
            <p className="text-xs text-foreground/50">Flagged</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Most active users (last 7 days)</CardTitle>
        </CardHeader>
        <div className="flex flex-col divide-y divide-border">
          {data.mostActiveUsers.length === 0 && <p className="py-4 text-center text-sm text-foreground/50">No activity yet</p>}
          {data.mostActiveUsers.map((u, i) => (
            <div key={u.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted text-xs font-bold">
                  {i + 1}
                </span>
                <p className="text-sm font-medium">{u.fullName}</p>
                <span className="text-xs text-foreground/40">Level {u.level}</span>
              </div>
              <span className="text-sm font-semibold text-brand-purple">{u.transactionCount} txns</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

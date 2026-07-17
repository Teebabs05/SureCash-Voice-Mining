"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, ShieldAlert, Banknote, ArrowUpFromLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

interface Stats {
  totalUsers: number;
  verifiedUsers: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  openFraudReports: number;
  totalDepositsApproved: number;
  totalWithdrawalsPaid: number;
  voiceRecordingsToday: number;
  signupTrend: { day: string; count: number }[];
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Stats>("/api/admin/stats")
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load stats"));
  }, []);

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-red-500">Couldn&apos;t load stats: {error}</p>
      </div>
    );
  }

  if (!stats) return <p className="text-sm text-foreground/50">Loading…</p>;

  const cards = [
    { label: "Total users", value: stats.totalUsers, icon: Users, sub: `${stats.verifiedUsers} verified` },
    { label: "Pending deposits", value: stats.pendingDeposits, icon: Banknote, sub: "Needs review" },
    { label: "Pending withdrawals", value: stats.pendingWithdrawals, icon: ArrowUpFromLine, sub: "Needs review" },
    { label: "Open fraud reports", value: stats.openFraudReports, icon: ShieldAlert, sub: "Needs review" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Overview</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, sub }) => (
          <Card key={label}>
            <Icon className="h-5 w-5 text-brand-primary" />
            <p className="mt-2 text-2xl font-bold">{value}</p>
            <p className="text-xs text-foreground/50">{label}</p>
            <p className="text-[10px] text-foreground/40">{sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <p className="mb-1 text-sm font-semibold">Total deposits approved</p>
          <p className="text-2xl font-bold text-brand-green">{formatCurrency(stats.totalDepositsApproved)}</p>
        </Card>
        <Card>
          <p className="mb-1 text-sm font-semibold">Total withdrawals paid</p>
          <p className="text-2xl font-bold text-brand-primary">{formatCurrency(stats.totalWithdrawalsPaid)}</p>
        </Card>
      </div>

      <Card>
        <p className="mb-3 text-sm font-semibold">Signups — last 7 days</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.signupTrend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { weekday: "short" })} fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString()} />
              <Line type="monotone" dataKey="count" stroke="#0D8A82" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

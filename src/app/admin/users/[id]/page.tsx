"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Ban, CheckCircle } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency, cn } from "@/lib/utils";

interface UserDetail {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  isBanned: boolean;
  banReason: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  level: number;
  xp: number;
  streakCount: number;
  tier: string;
  createdAt: string;
  plan: { name: string } | null;
  referredBy: { fullName: string; email: string } | null;
  wallets: { type: string; balance: string }[];
  _count: { referrals: number; voiceRecordings: number; taskCompletions: number };
}

interface Txn {
  id: string;
  type: string;
  reason: string;
  amount: string;
  balanceAfter: string;
  description: string | null;
  createdAt: string;
}

interface DepositOrWithdrawal {
  id: string;
  amount: string;
  method: string;
  status: string;
  createdAt: string;
}

const TIERS = ["FREE", "SILVER", "GOLD", "VIP"] as const;

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [transactions, setTransactions] = useState<Txn[]>([]);
  const [deposits, setDeposits] = useState<DepositOrWithdrawal[]>([]);
  const [withdrawals, setWithdrawals] = useState<DepositOrWithdrawal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    apiFetch<{
      user: UserDetail;
      transactions: Txn[];
      deposits: DepositOrWithdrawal[];
      withdrawals: DepositOrWithdrawal[];
    }>(`/api/admin/users/${id}`)
      .then((res) => {
        setUser(res.user);
        setTransactions(res.transactions);
        setDeposits(res.deposits);
        setWithdrawals(res.withdrawals);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load user"));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleBan() {
    if (!user) return;
    setBusy(true);
    try {
      await apiFetch(`/api/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ isBanned: !user.isBanned }) });
      toast.success(user.isBanned ? "User unbanned" : "User banned");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function changeTier(tier: string) {
    if (!user) return;
    setBusy(true);
    try {
      await apiFetch(`/api/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ tier }) });
      toast.success(`Moved to ${tier}`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => router.push("/admin/users")} className="flex items-center gap-1 text-sm text-foreground/60">
        <ArrowLeft className="h-4 w-4" /> Back to users
      </button>

      {error && <p className="text-sm text-red-500">Couldn&apos;t load user: {error}</p>}
      {!user && !error && <p className="text-sm text-foreground/50">Loading…</p>}

      {user && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{user.fullName}</h1>
              <p className="text-sm text-foreground/60">{user.email}</p>
              {user.phone && <p className="text-sm text-foreground/60">{user.phone}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={user.tier}
                disabled={busy}
                onChange={(e) => changeTier(e.target.value)}
                className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
              >
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <Button size="sm" variant={user.isBanned ? "outline" : "danger"} loading={busy} onClick={toggleBan}>
                {user.isBanned ? <CheckCircle className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                {user.isBanned ? "Unban" : "Ban"}
              </Button>
            </div>
          </div>

          {user.isBanned && user.banReason && (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">Ban reason: {user.banReason}</p>
          )}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {user.wallets.map((w) => (
              <Card key={w.type}>
                <p className="text-xs text-foreground/50">{w.type} wallet</p>
                <p className="mt-1 text-lg font-bold">{formatCurrency(w.balance)}</p>
              </Card>
            ))}
            <Card>
              <p className="text-xs text-foreground/50">Level / XP</p>
              <p className="mt-1 text-lg font-bold">
                {user.level} <span className="text-xs font-normal text-foreground/50">({user.xp} xp)</span>
              </p>
            </Card>
            <Card>
              <p className="text-xs text-foreground/50">Streak</p>
              <p className="mt-1 text-lg font-bold">{user.streakCount} days</p>
            </Card>
            <Card>
              <p className="text-xs text-foreground/50">Referrals</p>
              <p className="mt-1 text-lg font-bold">{user._count.referrals}</p>
            </Card>
            <Card>
              <p className="text-xs text-foreground/50">Plan</p>
              <p className="mt-1 text-lg font-bold">{user.plan?.name ?? "None"}</p>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <p>
                <span className="text-foreground/50">Role:</span> {user.role}
              </p>
              <p>
                <span className="text-foreground/50">Email verified:</span> {user.emailVerified ? "Yes" : "No"}
              </p>
              <p>
                <span className="text-foreground/50">Phone verified:</span> {user.phoneVerified ? "Yes" : "No"}
              </p>
              <p>
                <span className="text-foreground/50">Joined:</span> {new Date(user.createdAt).toLocaleDateString()}
              </p>
              {user.referredBy && (
                <p className="col-span-2">
                  <span className="text-foreground/50">Referred by:</span> {user.referredBy.fullName} ({user.referredBy.email})
                </p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent wallet activity</CardTitle>
            </CardHeader>
            <div className="flex flex-col divide-y divide-border">
              {transactions.length === 0 && <p className="py-2 text-sm text-foreground/50">No transactions yet</p>}
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium">{t.description ?? t.reason}</p>
                    <p className="text-xs text-foreground/50">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={cn("font-semibold", t.type === "CREDIT" ? "text-brand-green" : "text-red-500")}>
                    {t.type === "CREDIT" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent deposits</CardTitle>
              </CardHeader>
              <div className="flex flex-col divide-y divide-border">
                {deposits.length === 0 && <p className="py-2 text-sm text-foreground/50">None yet</p>}
                {deposits.map((d) => (
                  <div key={d.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium">{formatCurrency(d.amount)}</p>
                      <p className="text-xs text-foreground/50">{d.method} · {new Date(d.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs font-semibold text-foreground/60">{d.status}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent withdrawals</CardTitle>
              </CardHeader>
              <div className="flex flex-col divide-y divide-border">
                {withdrawals.length === 0 && <p className="py-2 text-sm text-foreground/50">None yet</p>}
                {withdrawals.map((w) => (
                  <div key={w.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium">{formatCurrency(w.amount)}</p>
                      <p className="text-xs text-foreground/50">{w.method} · {new Date(w.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs font-semibold text-foreground/60">{w.status}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

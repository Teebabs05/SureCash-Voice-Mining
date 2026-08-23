"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Ban, CheckCircle, ShieldCheck, Lock, Unlock, Trash2, Pencil, LogIn } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  withdrawalsLocked: boolean;
  withdrawalLockNote: string | null;
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
const ROLES = ["USER", "ADMIN", "SUPERADMIN"] as const;
const WALLET_TYPES = ["MAIN", "ENGAGEMENT", "SALES"] as const;

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [transactions, setTransactions] = useState<Txn[]>([]);
  const [deposits, setDeposits] = useState<DepositOrWithdrawal[]>([]);
  const [withdrawals, setWithdrawals] = useState<DepositOrWithdrawal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: "", email: "", phone: "" });

  const [showLockForm, setShowLockForm] = useState(false);
  const [lockNote, setLockNote] = useState("");

  const [adjustForm, setAdjustForm] = useState({ walletType: "MAIN", direction: "credit", amount: "", reason: "" });
  const [adjusting, setAdjusting] = useState(false);

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
    apiFetch<{ user: { role: string } }>("/api/auth/me").then((res) => setMyRole(res.user.role));
  }, [load]);

  async function patch(body: Record<string, unknown>, successMessage: string) {
    if (!user) return;
    setBusy(true);
    try {
      await apiFetch(`/api/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify(body) });
      toast.success(successMessage);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  function startEditProfile() {
    if (!user) return;
    setProfileForm({ fullName: user.fullName, email: user.email, phone: user.phone ?? "" });
    setEditingProfile(true);
  }

  async function saveProfile() {
    await patch(
      { fullName: profileForm.fullName, email: profileForm.email, phone: profileForm.phone || undefined },
      "Profile updated"
    );
    setEditingProfile(false);
  }

  async function toggleLock() {
    if (!user) return;
    if (user.withdrawalsLocked) {
      await patch({ withdrawalsLocked: false }, "Withdrawals unlocked");
    } else {
      setShowLockForm(true);
    }
  }

  async function confirmLock() {
    await patch({ withdrawalsLocked: true, withdrawalLockNote: lockNote || undefined }, "Withdrawals locked");
    setShowLockForm(false);
    setLockNote("");
  }

  async function deleteUser() {
    if (!user) return;
    if (!confirm(`Permanently delete ${user.fullName} (${user.email})? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await apiFetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      toast.success("User deleted");
      router.push("/admin/users");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete user");
    } finally {
      setBusy(false);
    }
  }

  async function loginAsUser() {
    if (!user) return;
    setBusy(true);
    try {
      await apiFetch(`/api/admin/users/${user.id}/impersonate`, { method: "POST" });
      window.location.assign("/dashboard");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not log in as this user");
      setBusy(false);
    }
  }

  async function submitAdjustment() {
    if (!user) return;
    if (!adjustForm.amount || Number(adjustForm.amount) <= 0) return toast.error("Enter a valid amount");
    if (!adjustForm.reason.trim()) return toast.error("A reason is required");
    setAdjusting(true);
    try {
      await apiFetch(`/api/admin/users/${user.id}/wallet-adjustment`, {
        method: "POST",
        body: JSON.stringify({ ...adjustForm, amount: Number(adjustForm.amount) }),
      });
      toast.success(`Wallet ${adjustForm.direction}ed`);
      setAdjustForm({ walletType: "MAIN", direction: "credit", amount: "", reason: "" });
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not adjust wallet");
    } finally {
      setAdjusting(false);
    }
  }

  const isSuperAdmin = myRole === "SUPERADMIN";

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
                onChange={(e) => patch({ tier: e.target.value }, `Moved to ${e.target.value}`)}
                className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
              >
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant={user.isBanned ? "outline" : "danger"}
                loading={busy}
                onClick={() => patch({ isBanned: !user.isBanned }, user.isBanned ? "User unbanned" : "User banned")}
              >
                {user.isBanned ? <CheckCircle className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                {user.isBanned ? "Unban" : "Ban"}
              </Button>
              <Button size="sm" variant={user.withdrawalsLocked ? "outline" : "danger"} loading={busy} onClick={toggleLock}>
                {user.withdrawalsLocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                {user.withdrawalsLocked ? "Unlock withdrawals" : "Lock withdrawals"}
              </Button>
              {!user.emailVerified && (
                <Button size="sm" variant="outline" loading={busy} onClick={() => patch({ emailVerified: true }, "Email verified")}>
                  <ShieldCheck className="h-3.5 w-3.5" /> Verify email
                </Button>
              )}
              {user.role === "USER" && !user.isBanned && (
                <Button size="sm" variant="outline" loading={busy} onClick={loginAsUser}>
                  <LogIn className="h-3.5 w-3.5" /> Login as this user
                </Button>
              )}
              {isSuperAdmin && (
                <Button size="sm" variant="danger" loading={busy} onClick={deleteUser}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              )}
            </div>
          </div>

          {user.isBanned && user.banReason && (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">Ban reason: {user.banReason}</p>
          )}
          {user.withdrawalsLocked && (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">
              Withdrawals locked{user.withdrawalLockNote ? `: ${user.withdrawalLockNote}` : ""}
            </p>
          )}

          {showLockForm && (
            <Card>
              <p className="mb-2 text-sm font-semibold">Lock withdrawals - optional note shown to the user</p>
              <div className="flex gap-2">
                <Input placeholder="e.g. Verifying a recent deposit" value={lockNote} onChange={(e) => setLockNote(e.target.value)} />
                <Button size="sm" loading={busy} onClick={confirmLock}>
                  Confirm lock
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowLockForm(false)}>
                  Cancel
                </Button>
              </div>
            </Card>
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
              <div className="flex items-center justify-between">
                <CardTitle>Account</CardTitle>
                {!editingProfile && (
                  <Button size="sm" variant="outline" onClick={startEditProfile}>
                    <Pencil className="h-3.5 w-3.5" /> Edit profile
                  </Button>
                )}
              </div>
            </CardHeader>

            {editingProfile ? (
              <div className="flex flex-col gap-2">
                <Input
                  label="Full name"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                />
                <Input
                  label="Email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
                <Input
                  label="Phone"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button size="sm" loading={busy} onClick={saveProfile}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingProfile(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-foreground/50">Role:</span>
                  {isSuperAdmin ? (
                    <select
                      value={user.role}
                      disabled={busy}
                      onChange={(e) => patch({ role: e.target.value }, `Role changed to ${e.target.value}`)}
                      className="rounded-lg border border-border bg-surface px-1.5 py-0.5 text-xs"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span>{user.role}</span>
                  )}
                </div>
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
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manually credit or debit a wallet</CardTitle>
            </CardHeader>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <select
                  value={adjustForm.walletType}
                  onChange={(e) => setAdjustForm({ ...adjustForm, walletType: e.target.value })}
                  className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                >
                  {WALLET_TYPES.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
                <select
                  value={adjustForm.direction}
                  onChange={(e) => setAdjustForm({ ...adjustForm, direction: e.target.value })}
                  className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                >
                  <option value="credit">Credit (add)</option>
                  <option value="debit">Debit (remove)</option>
                </select>
                <Input
                  placeholder="Amount"
                  type="number"
                  value={adjustForm.amount}
                  onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                />
              </div>
              <Input
                placeholder="Reason (shown in the user's notification and the audit log)"
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              />
              <Button size="sm" loading={adjusting} onClick={submitAdjustment} className="w-fit">
                Apply adjustment
              </Button>
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

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Landmark, CheckCircle2, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiError } from "@/lib/api-client";

interface PendingBankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isVerified: boolean;
  createdAt: string;
  user: { id: string; fullName: string; email: string };
}

interface Bank {
  code: string;
  name: string;
}

interface TestResolveResult {
  provider: string | null;
  ok: boolean;
  status: number;
  request: unknown;
  body: unknown;
}

function TestResolveCard() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResolveResult | null>(null);

  useEffect(() => {
    apiFetch<{ banks: Bank[] }>("/api/banks").then((res) => setBanks(res.banks));
  }, []);

  async function runTest() {
    if (!bankCode || accountNumber.length !== 10) return toast.error("Pick a bank and enter a 10-digit account number");
    setTesting(true);
    setResult(null);
    try {
      const res = await apiFetch<TestResolveResult>("/api/admin/bank-accounts/test-resolve", {
        method: "POST",
        body: JSON.stringify({ bankCode, accountNumber }),
      });
      setResult(res);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Test failed");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test bank resolution</CardTitle>
      </CardHeader>
      <p className="mb-3 text-xs text-foreground/50">
        Runs the exact same lookup as the &quot;Add bank account&quot; flow, using whichever gateway is currently
        active, and shows the raw response — useful for diagnosing why a specific bank won&apos;t auto-verify.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={bankCode}
          onChange={(e) => setBankCode(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-primary sm:flex-1"
        >
          <option value="">Select a bank</option>
          {banks.map((b) => (
            <option key={b.code} value={b.code}>
              {b.name} ({b.code})
            </option>
          ))}
        </select>
        <Input
          placeholder="10-digit account number"
          value={accountNumber}
          maxLength={10}
          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
          className="sm:w-56"
        />
        <Button size="sm" loading={testing} onClick={runTest} className="flex-none">
          Test
        </Button>
      </div>
      {result && (
        <div className="mt-3 rounded-xl bg-surface-muted p-3">
          <p className={`mb-1 text-xs font-bold ${result.ok ? "text-brand-green" : "text-red-500"}`}>
            {result.provider ?? "No provider"} · HTTP {result.status} · {result.ok ? "OK" : "Failed"}
          </p>
          <pre className="overflow-x-auto text-[11px] leading-relaxed text-foreground/70">
            {JSON.stringify({ request: result.request, response: result.body }, null, 2)}
          </pre>
        </div>
      )}
    </Card>
  );
}

export default function AdminBankAccountsPage() {
  const [accounts, setAccounts] = useState<PendingBankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  function load() {
    apiFetch<{ accounts: PendingBankAccount[] }>("/api/admin/bank-accounts")
      .then((res) => {
        setAccounts(res.accounts);
        setLoadError(null);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Could not load bank accounts"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    setActingId(id);
    try {
      await apiFetch(`/api/admin/bank-accounts/${id}/approve`, { method: "POST" });
      toast.success("Bank account approved");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not approve");
    } finally {
      setActingId(null);
    }
  }

  async function reject(id: string) {
    if (!reason.trim()) return toast.error("Enter a reason for the user");
    setActingId(id);
    try {
      await apiFetch(`/api/admin/bank-accounts/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) });
      toast.success("Bank account rejected");
      setRejectingId(null);
      setReason("");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not reject");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Bank Account Review</h1>
        <p className="text-sm text-foreground/60">
          Accounts here couldn&apos;t be auto-verified (no bank API configured, or the lookup failed) and need a
          human to confirm the account name matches the account holder before withdrawals go out.
        </p>
      </div>

      <TestResolveCard />

      {loading && <p className="text-sm text-foreground/50">Loading…</p>}
      {!loading && loadError && (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">{loadError}</p>
      )}
      {!loading && !loadError && accounts.length === 0 && (
        <p className="py-10 text-center text-sm text-foreground/50">Nothing waiting on review.</p>
      )}

      <div className="flex flex-col gap-3">
        {accounts.map((acc) => (
          <Card key={acc.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                  <Landmark className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {acc.user.fullName} <span className="font-normal text-foreground/50">· {acc.user.email}</span>
                  </p>
                  <p className="text-sm">{acc.bankName}</p>
                  <p className="text-xs text-foreground/50">
                    {acc.accountName} · {acc.accountNumber}
                  </p>
                  <p className="mt-1 text-[10px] text-foreground/40">
                    Added {new Date(acc.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {acc.isVerified ? (
                <span className="flex flex-none items-center gap-1 rounded-full bg-brand-green/15 px-2.5 py-1 text-[10px] font-bold text-brand-green">
                  <CheckCircle2 className="h-3.5 w-3.5" /> OTP confirmed
                </span>
              ) : (
                <span className="flex flex-none items-center gap-1 rounded-full bg-brand-amber/15 px-2.5 py-1 text-[10px] font-bold text-[#a67c00]">
                  <Clock className="h-3.5 w-3.5" /> Awaiting OTP
                </span>
              )}
            </div>

            {rejectingId === acc.id ? (
              <div className="flex flex-col gap-2 rounded-xl bg-surface-muted p-3">
                <textarea
                  placeholder="Why is this being rejected? (shown to the user)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-16 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-primary"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="danger" loading={actingId === acc.id} onClick={() => reject(acc.id)}>
                    Confirm reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRejectingId(null);
                      setReason("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" loading={actingId === acc.id} onClick={() => approve(acc.id)}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRejectingId(acc.id)}>
                  Reject
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

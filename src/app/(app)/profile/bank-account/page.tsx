"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Landmark,
  CheckCircle2,
  Clock,
  Plus,
  XCircle,
  Trash2,
  ShieldCheck,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BankAccountForm } from "@/components/wallet/bank-account-form";
import { apiFetch, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  autoVerified: boolean;
  isVerified: boolean;
  isPrimary: boolean;
  reviewNote: string | null;
}

function statusBadge(acc: BankAccount, onSendOtp: (acc: BankAccount) => void) {
  if (acc.isVerified && acc.autoVerified) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-brand-green/15 px-2.5 py-1 text-[10px] font-bold text-brand-green">
        <CheckCircle2 className="h-3.5 w-3.5" /> Ready
      </span>
    );
  }
  if (acc.reviewNote) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-bold text-red-500">
        <XCircle className="h-3.5 w-3.5" /> Rejected
      </span>
    );
  }
  if (!acc.isVerified) {
    return (
      <button
        onClick={() => onSendOtp(acc)}
        className="flex items-center gap-1 rounded-full bg-brand-amber/15 px-2.5 py-1 text-[10px] font-bold text-[#a67c00] hover:bg-brand-amber/25"
      >
        <Clock className="h-3.5 w-3.5" /> Send OTP
      </button>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-brand-amber/15 px-2.5 py-1 text-[10px] font-bold text-[#a67c00]">
      <Clock className="h-3.5 w-3.5" /> Awaiting review
    </span>
  );
}

export default function BankAccountPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [pendingOtpId, setPendingOtpId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<{ accounts: BankAccount[] }>("/api/bank-accounts").then((res) => setAccounts(res.accounts));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function onBankAccountAdded(account: BankAccount) {
    toast.success("OTP sent — confirm to activate this account");
    setPendingOtpId(account.id);
    setShowAddAccount(false);
    load();
  }

  async function removeAccount(acc: BankAccount) {
    if (!confirm(`Remove ${acc.bankName} •••${acc.accountNumber.slice(-4)}? This cannot be undone.`)) return;
    setRemovingId(acc.id);
    try {
      await apiFetch(`/api/bank-accounts/${acc.id}`, { method: "DELETE" });
      toast.success("Bank account removed");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not remove this account");
    } finally {
      setRemovingId(null);
    }
  }

  async function makeDefault(acc: BankAccount) {
    setSettingDefaultId(acc.id);
    try {
      await apiFetch(`/api/bank-accounts/${acc.id}/make-default`, { method: "POST" });
      toast.success(`${acc.bankName} set as your default payout method`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update default account");
    } finally {
      setSettingDefaultId(null);
    }
  }

  async function resendOtp(acc: BankAccount) {
    setLoading(true);
    try {
      await apiFetch(`/api/bank-accounts/${acc.id}/resend-otp`, { method: "POST" });
      toast.success("OTP sent — check your email");
      setPendingOtpId(acc.id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function confirmOtp() {
    if (!pendingOtpId) return;
    setLoading(true);
    try {
      await apiFetch("/api/bank-accounts/verify-otp", {
        method: "POST",
        body: JSON.stringify({ bankAccountId: pendingOtpId, code: otp }),
      });
      toast.success("Bank account confirmed");
      setPendingOtpId(null);
      setOtp("");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  }

  const primary = accounts.find((a) => a.isPrimary) ?? accounts[0];
  const otherAccounts = accounts.filter((a) => a.id !== primary?.id);

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-foreground/60">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div>
        <h1 className="text-xl font-bold">Bank Account</h1>
        <p className="text-sm text-foreground/60">Where you get paid.</p>
      </div>

      {primary && (
        <div className="gradient-wallet-main relative overflow-hidden rounded-3xl p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <Landmark className="h-5 w-5" />
            </div>
            {primary.isVerified && primary.autoVerified && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-primary">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            )}
          </div>

          <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-white/60">Active payout method</p>
          <p className="mt-1 text-lg font-bold uppercase leading-tight">{primary.accountName}</p>
          <p className="mt-1 text-2xl font-bold tracking-widest">{primary.accountNumber}</p>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm font-medium text-white/80">{primary.bankName}</p>
            <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-white/25">
              Default
            </span>
          </div>
        </div>
      )}

      {primary && (!primary.isVerified || !primary.autoVerified) && (
        <div className="-mt-2">{statusBadge(primary, resendOtp)}</div>
      )}

      {otherAccounts.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/40">Other accounts</p>
          {otherAccounts.map((acc) => (
            <Card key={acc.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                    <Landmark className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{acc.bankName}</p>
                    <p className="text-xs text-foreground/50">
                      {acc.accountName} · •••{acc.accountNumber.slice(-4)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-none items-center gap-2">
                  {statusBadge(acc, resendOtp)}
                  <button
                    onClick={() => removeAccount(acc)}
                    disabled={removingId === acc.id}
                    aria-label="Remove bank account"
                    className="rounded-full p-1.5 text-foreground/40 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {acc.reviewNote && (
                <div className="rounded-lg bg-red-500/10 px-3 py-2">
                  <p className="text-xs text-red-500">{acc.reviewNote} — remove this and add the correct details.</p>
                </div>
              )}
              {acc.isVerified && acc.autoVerified && (
                <button
                  onClick={() => makeDefault(acc)}
                  disabled={settingDefaultId === acc.id}
                  className={cn(
                    "flex items-center gap-1.5 self-start text-xs font-semibold text-brand-primary disabled:opacity-50"
                  )}
                >
                  <Star className="h-3.5 w-3.5" /> Make default
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

      {accounts.length === 0 && (
        <p className="py-4 text-center text-sm text-foreground/50">No bank account linked yet</p>
      )}

      {pendingOtpId && (
        <Card className="border border-brand-amber/40">
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-brand-amber" /> Confirm with OTP
              </span>
            </CardTitle>
          </CardHeader>
          <p className="mb-2 text-xs text-foreground/50">Enter the code sent to your email to activate this account.</p>
          <div className="flex gap-2">
            <Input placeholder="Code from your email" value={otp} onChange={(e) => setOtp(e.target.value)} />
            <Button loading={loading} onClick={confirmOtp}>
              Confirm
            </Button>
          </div>
        </Card>
      )}

      {showAddAccount ? (
        <Card>
          <CardHeader>
            <CardTitle>{accounts.length === 0 ? "Add Bank Account" : "Update Bank Account"}</CardTitle>
          </CardHeader>
          <BankAccountForm onAdded={onBankAccountAdded} />
        </Card>
      ) : (
        <Button variant="outline" onClick={() => setShowAddAccount(true)}>
          <Plus className="h-4 w-4" /> Add bank account
        </Button>
      )}
    </div>
  );
}

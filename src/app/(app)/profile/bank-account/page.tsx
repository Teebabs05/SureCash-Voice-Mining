"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Landmark, CheckCircle2, Clock, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BankAccountForm } from "@/components/wallet/bank-account-form";
import { apiFetch, ApiError } from "@/lib/api-client";

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  autoVerified: boolean;
  isVerified: boolean;
}

export default function BankAccountPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [pendingOtpId, setPendingOtpId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-foreground/60">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-xl font-bold">Bank Account</h1>
      <p className="text-sm text-foreground/60">Manage the account your withdrawals are paid into.</p>

      {accounts.map((acc) => (
        <Card key={acc.id} className="flex items-center justify-between gap-3">
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
          {acc.isVerified ? (
            <span className="flex items-center gap-1 rounded-full bg-brand-green/15 px-2.5 py-1 text-[10px] font-bold text-brand-green">
              <CheckCircle2 className="h-3.5 w-3.5" /> Added
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-brand-amber/15 px-2.5 py-1 text-[10px] font-bold text-[#a67c00]">
              <Clock className="h-3.5 w-3.5" /> Pending
            </span>
          )}
        </Card>
      ))}

      {accounts.length === 0 && (
        <p className="py-4 text-center text-sm text-foreground/50">No bank account linked yet</p>
      )}

      {pendingOtpId && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm with OTP</CardTitle>
          </CardHeader>
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
            <CardTitle>Add bank account</CardTitle>
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

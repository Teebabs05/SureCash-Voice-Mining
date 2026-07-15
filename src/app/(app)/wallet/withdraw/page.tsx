"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency, cn } from "@/lib/utils";

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isVerified: boolean;
}

interface Withdrawal {
  id: string;
  amount: string;
  fee: string;
  status: string;
  createdAt: string;
  bankAccount: BankAccount;
}

export default function WithdrawPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ bankName: "", bankCode: "", accountNumber: "" });
  const [pendingOtpAccountId, setPendingOtpAccountId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");

  const load = useCallback(() => {
    apiFetch<{ accounts: BankAccount[] }>("/api/bank-accounts").then((res) => {
      setAccounts(res.accounts);
      if (res.accounts.length > 0) setSelectedAccount((prev) => prev || res.accounts[0].id);
    });
    apiFetch<{ withdrawals: Withdrawal[] }>("/api/withdrawals").then((res) => setWithdrawals(res.withdrawals));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addAccount() {
    setLoading(true);
    try {
      const res = await apiFetch<{ account: BankAccount }>("/api/bank-accounts", {
        method: "POST",
        body: JSON.stringify(newAccount),
      });
      toast.success("OTP sent — confirm to activate this account");
      setPendingOtpAccountId(res.account.id);
      setShowAddAccount(false);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not add bank account");
    } finally {
      setLoading(false);
    }
  }

  async function confirmOtp() {
    if (!pendingOtpAccountId) return;
    setLoading(true);
    try {
      await apiFetch("/api/bank-accounts/verify-otp", {
        method: "POST",
        body: JSON.stringify({ bankAccountId: pendingOtpAccountId, code: otp }),
      });
      toast.success("Bank account confirmed");
      setPendingOtpAccountId(null);
      setOtp("");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  }

  async function submitWithdrawal() {
    if (!selectedAccount) return toast.error("Add a bank account first");
    if (!amount || Number(amount) <= 0) return toast.error("Enter a valid amount");
    setLoading(true);
    try {
      await apiFetch("/api/withdrawals", {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount), bankAccountId: selectedAccount }),
      });
      toast.success("Withdrawal requested");
      setAmount("");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-foreground/60">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-xl font-bold">Withdraw</h1>

      {pendingOtpAccountId && (
        <Card className="border border-brand-gold/40">
          <p className="text-sm font-medium">Enter the OTP sent to confirm your bank account</p>
          <div className="mt-2 flex gap-2">
            <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" />
            <Button loading={loading} onClick={confirmOtp}>Confirm</Button>
          </div>
        </Card>
      )}

      <Card>
        <p className="mb-2 text-sm font-semibold">Bank account</p>
        {accounts.length === 0 && !showAddAccount && (
          <p className="mb-2 text-sm text-foreground/50">No bank accounts linked yet.</p>
        )}
        <div className="flex flex-col gap-2">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => setSelectedAccount(acc.id)}
              className={cn(
                "flex items-center justify-between rounded-xl border p-3 text-left text-sm",
                selectedAccount === acc.id ? "border-brand-purple bg-brand-purple/5" : "border-border"
              )}
            >
              <div>
                <p className="font-medium">{acc.accountName}</p>
                <p className="text-xs text-foreground/50">{acc.bankName} · {acc.accountNumber}</p>
              </div>
              {acc.isVerified && <ShieldCheck className="h-4 w-4 text-brand-green" />}
            </button>
          ))}
        </div>

        {showAddAccount ? (
          <div className="mt-3 flex flex-col gap-2">
            <Input placeholder="Bank name" value={newAccount.bankName} onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })} />
            <Input placeholder="Bank code" value={newAccount.bankCode} onChange={(e) => setNewAccount({ ...newAccount, bankCode: e.target.value })} />
            <Input placeholder="Account number" value={newAccount.accountNumber} onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })} />
            <Button loading={loading} onClick={addAccount}>Add & send OTP</Button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddAccount(true)}
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-border py-2.5 text-sm text-brand-purple"
          >
            <Plus className="h-4 w-4" /> Add bank account
          </button>
        )}
      </Card>

      <Card>
        <Input label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        <Button className="mt-3 w-full" loading={loading} onClick={submitWithdrawal}>
          Request withdrawal
        </Button>
      </Card>

      {withdrawals.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-foreground/70">Withdrawal history</h2>
          <div className="flex flex-col gap-2">
            {withdrawals.map((w) => (
              <Card key={w.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium">{formatCurrency(w.amount)}</p>
                  <p className="text-xs text-foreground/50">{new Date(w.createdAt).toLocaleDateString()}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    (w.status === "APPROVED" || w.status === "PAID") && "bg-brand-green/15 text-brand-green",
                    w.status === "PENDING" && "bg-brand-gold/15 text-[#a67c00]",
                    w.status === "REJECTED" && "bg-red-500/15 text-red-500"
                  )}
                >
                  {w.status}
                </span>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

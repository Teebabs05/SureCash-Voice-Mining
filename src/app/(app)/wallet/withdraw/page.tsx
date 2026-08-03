"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, ShieldCheck, Repeat } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency, cn } from "@/lib/utils";
import { WithdrawalStepper } from "@/components/wallet/withdrawal-stepper";
import { BankAccountForm } from "@/components/wallet/bank-account-form";
import { CryptoWalletForm } from "@/components/wallet/crypto-wallet-form";
import { WALLET_META, TRANSFERABLE_WALLETS } from "@/lib/wallet-meta";
import type { WalletType } from "@prisma/client";

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  autoVerified: boolean;
  isVerified: boolean;
}

interface CryptoWallet {
  id: string;
  address: string;
  network: string;
  isVerified: boolean;
}

interface Withdrawal {
  id: string;
  method: string;
  amount: string;
  usdtAmount: string | null;
  fee: string;
  status: string;
  createdAt: string;
  payoutProvider: string;
  bankAccount: BankAccount | null;
  cryptoWallet: CryptoWallet | null;
}

type PendingOtp = { id: string; kind: "bank" | "crypto" } | null;

export default function WithdrawPage() {
  const router = useRouter();
  const [method, setMethod] = useState<"BANK" | "USDT">("BANK");
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [cryptoWallets, setCryptoWallets] = useState<CryptoWallet[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedCryptoWallet, setSelectedCryptoWallet] = useState<string>("");
  const [walletType, setWalletType] = useState<WalletType>("ENGAGEMENT");
  const [walletBalances, setWalletBalances] = useState<Record<string, number>>({});
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [pendingOtp, setPendingOtp] = useState<PendingOtp>(null);
  const [otp, setOtp] = useState("");

  const load = useCallback(() => {
    apiFetch<{ accounts: BankAccount[] }>("/api/bank-accounts").then((res) => {
      setAccounts(res.accounts);
      if (res.accounts.length > 0) {
        const eligible = res.accounts.find((a) => a.isVerified && a.autoVerified);
        setSelectedAccount((prev) => prev || eligible?.id || res.accounts[0].id);
      }
    });
    apiFetch<{ wallets: CryptoWallet[] }>("/api/crypto-wallets").then((res) => {
      setCryptoWallets(res.wallets);
      if (res.wallets.length > 0) setSelectedCryptoWallet((prev) => prev || res.wallets[0].id);
    });
    apiFetch<{ withdrawals: Withdrawal[] }>("/api/withdrawals").then((res) => setWithdrawals(res.withdrawals));
    apiFetch<{ wallets: { type: string; balance: number }[] }>("/api/wallet").then((res) =>
      setWalletBalances(Object.fromEntries(res.wallets.map((w) => [w.type, w.balance])))
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function onBankAccountAdded(account: BankAccount) {
    toast.success("OTP sent — confirm to activate this account");
    setPendingOtp({ id: account.id, kind: "bank" });
    setShowAddAccount(false);
    load();
  }

  function onCryptoWalletAdded(wallet: CryptoWallet) {
    toast.success("OTP sent — confirm to activate this wallet");
    setPendingOtp({ id: wallet.id, kind: "crypto" });
    setShowAddAccount(false);
    load();
  }

  async function resendBankOtp(accountId: string) {
    setLoading(true);
    try {
      await apiFetch(`/api/bank-accounts/${accountId}/resend-otp`, { method: "POST" });
      toast.success("OTP sent — check your email");
      setPendingOtp({ id: accountId, kind: "bank" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function resendCryptoOtp(walletId: string) {
    setLoading(true);
    try {
      await apiFetch(`/api/crypto-wallets/${walletId}/resend-otp`, { method: "POST" });
      toast.success("OTP sent — check your email");
      setPendingOtp({ id: walletId, kind: "crypto" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function confirmOtp() {
    if (!pendingOtp) return;
    setLoading(true);
    try {
      if (pendingOtp.kind === "bank") {
        await apiFetch("/api/bank-accounts/verify-otp", {
          method: "POST",
          body: JSON.stringify({ bankAccountId: pendingOtp.id, code: otp }),
        });
      } else {
        await apiFetch("/api/crypto-wallets/verify-otp", {
          method: "POST",
          body: JSON.stringify({ cryptoWalletId: pendingOtp.id, code: otp }),
        });
      }
      toast.success("Confirmed");
      setPendingOtp(null);
      setOtp("");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  }

  const selectedBankAccount = accounts.find((a) => a.id === selectedAccount);
  const bankAccountBlocked = method === "BANK" && selectedBankAccount && !(selectedBankAccount.isVerified && selectedBankAccount.autoVerified);

  async function submitWithdrawal() {
    if (method === "BANK" && !selectedAccount) return toast.error("Add a bank account first");
    if (method === "BANK" && selectedBankAccount && !selectedBankAccount.isVerified) {
      return toast.error("Confirm this account with the OTP sent to you first");
    }
    if (method === "BANK" && selectedBankAccount && !selectedBankAccount.autoVerified) {
      return toast.error("This account is still awaiting manual review before it can be paid out to");
    }
    if (method === "USDT" && !selectedCryptoWallet) return toast.error("Add a USDT wallet first");
    if (!amount || Number(amount) <= 0) return toast.error("Enter a valid amount");
    setLoading(true);
    try {
      await apiFetch("/api/withdrawals", {
        method: "POST",
        body: JSON.stringify({
          amount: Number(amount),
          method,
          walletType,
          bankAccountId: method === "BANK" ? selectedAccount : undefined,
          cryptoWalletId: method === "USDT" ? selectedCryptoWallet : undefined,
        }),
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

      <div className="flex gap-2 rounded-xl bg-surface-muted p-1">
        {(["BANK", "USDT"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMethod(m);
              setShowAddAccount(false);
            }}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium",
              method === m ? "bg-surface shadow" : "text-foreground/50"
            )}
          >
            {m === "BANK" ? "Bank Transfer" : "USDT"}
          </button>
        ))}
      </div>

      {pendingOtp && (
        <Card className="border border-brand-amber/40">
          <p className="text-sm font-medium">
            Enter the OTP sent to confirm your {pendingOtp.kind === "bank" ? "bank account" : "USDT wallet"}
          </p>
          <div className="mt-2 flex gap-2">
            <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" />
            <Button loading={loading} onClick={confirmOtp}>Confirm</Button>
          </div>
        </Card>
      )}

      {method === "BANK" ? (
        <Card>
          <p className="mb-2 text-sm font-semibold">Bank account</p>
          {accounts.length === 0 && !showAddAccount && (
            <p className="mb-2 text-sm text-foreground/50">No bank accounts linked yet.</p>
          )}
          <div className="flex flex-col gap-2">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                onClick={() => setSelectedAccount(acc.id)}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-xl border p-3 text-left text-sm",
                  selectedAccount === acc.id ? "border-brand-primary bg-brand-primary/5" : "border-border"
                )}
              >
                <div>
                  <p className="font-medium">{acc.accountName}</p>
                  <p className="text-xs text-foreground/50">{acc.bankName} · {acc.accountNumber}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {acc.isVerified && acc.autoVerified ? (
                    <span className="flex items-center gap-1 rounded-full bg-brand-green/15 px-2 py-0.5 text-[10px] font-bold text-brand-green">
                      <ShieldCheck className="h-3.5 w-3.5" /> Ready
                    </span>
                  ) : !acc.isVerified ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resendBankOtp(acc.id);
                      }}
                      className="rounded-full bg-brand-amber/15 px-2 py-0.5 text-[10px] font-bold text-[#a67c00] hover:bg-brand-amber/25"
                    >
                      Send OTP
                    </button>
                  ) : (
                    <span className="rounded-full bg-brand-amber/15 px-2 py-0.5 text-[10px] font-bold text-[#a67c00]">
                      Awaiting review
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {bankAccountBlocked && (
            <p className="mt-2 text-xs text-[#a67c00]">
              {!selectedBankAccount?.isVerified
                ? "Confirm this account with the OTP sent to you before you can withdraw to it."
                : "This account is still awaiting manual review — you'll be notified once it's approved."}
            </p>
          )}

          {showAddAccount ? (
            <div className="mt-3">
              <BankAccountForm onAdded={onBankAccountAdded} />
            </div>
          ) : (
            <button
              onClick={() => setShowAddAccount(true)}
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-border py-2.5 text-sm text-brand-primary"
            >
              <Plus className="h-4 w-4" /> Add bank account
            </button>
          )}
        </Card>
      ) : (
        <Card>
          <p className="mb-2 text-sm font-semibold">USDT wallet</p>
          {cryptoWallets.length === 0 && !showAddAccount && (
            <p className="mb-2 text-sm text-foreground/50">No USDT wallets linked yet.</p>
          )}
          <div className="flex flex-col gap-2">
            {cryptoWallets.map((w) => (
              <div
                key={w.id}
                onClick={() => setSelectedCryptoWallet(w.id)}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-xl border p-3 text-left text-sm",
                  selectedCryptoWallet === w.id ? "border-brand-primary bg-brand-primary/5" : "border-border"
                )}
              >
                <div>
                  <p className="break-all font-medium">{w.address}</p>
                  <p className="text-xs text-foreground/50">{w.network}</p>
                </div>
                {w.isVerified ? (
                  <span title="OTP confirmed">
                    <ShieldCheck className="h-4 w-4 flex-none text-brand-green" />
                  </span>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resendCryptoOtp(w.id);
                    }}
                    className="flex-none rounded-full bg-brand-amber/15 px-2 py-0.5 text-[10px] font-bold text-[#a67c00] hover:bg-brand-amber/25"
                  >
                    Send OTP
                  </button>
                )}
              </div>
            ))}
          </div>

          {showAddAccount ? (
            <div className="mt-3">
              <CryptoWalletForm onAdded={onCryptoWalletAdded} />
            </div>
          ) : (
            <button
              onClick={() => setShowAddAccount(true)}
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-border py-2.5 text-sm text-brand-primary"
            >
              <Plus className="h-4 w-4" /> Add USDT wallet
            </button>
          )}
        </Card>
      )}

      <Card>
        <p className="mb-2 text-sm font-semibold">Withdraw from</p>
        <div className="grid grid-cols-2 gap-2">
          {TRANSFERABLE_WALLETS.map((w) => (
            <button
              key={w}
              onClick={() => setWalletType(w)}
              className={cn(
                "rounded-xl border p-3 text-left",
                walletType === w ? "border-brand-primary bg-brand-primary/5" : "border-border"
              )}
            >
              <p className="text-sm font-medium">{WALLET_META[w].label}</p>
              <p className="text-xs text-foreground/50">{formatCurrency(walletBalances[w] ?? 0)} available</p>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-foreground/50">
          Deposit wallet is for deposits and site spending only — it can&apos;t be withdrawn from.
        </p>
        <Link
          href="/wallet?transfer=1"
          className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-sm font-medium text-brand-primary"
        >
          <Repeat className="h-4 w-4" /> Transfer between wallets
        </Link>
        <p className="mt-2 text-xs text-foreground/50">
          Short on balance in one of these? Move money from Engagement to Sales (or vice versa) so you have enough
          to withdraw.
        </p>
      </Card>

      <Card>
        <Input label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        {method === "USDT" && (
          <p className="mt-2 text-xs text-foreground/50">
            A flat network fee applies on top of the usual withdrawal fee for USDT payouts.
          </p>
        )}
        <Button className="mt-3 w-full" loading={loading} disabled={Boolean(bankAccountBlocked)} onClick={submitWithdrawal}>
          Request withdrawal
        </Button>
      </Card>

      {withdrawals.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-foreground/70">Withdrawal history</h2>
          <div className="flex flex-col gap-2">
            {withdrawals.map((w) => (
              <Card key={w.id} className="flex flex-col gap-3 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{formatCurrency(w.amount)}</p>
                    {w.method === "USDT" && w.usdtAmount && (
                      <p className="text-xs text-foreground/50">≈ {w.usdtAmount} USDT</p>
                    )}
                  </div>
                  <p className="text-xs text-foreground/50">{new Date(w.createdAt).toLocaleDateString()}</p>
                </div>
                {w.status === "PROCESSING" && w.payoutProvider !== "MANUAL" && (
                  <p className="text-xs text-brand-primary">⚡ Processing instantly via {w.payoutProvider}</p>
                )}
                <WithdrawalStepper status={w.status} />
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

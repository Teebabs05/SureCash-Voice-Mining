"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Repeat, Gift } from "lucide-react";
import { WalletCarousel, type WalletCardData } from "@/components/wallet/wallet-carousel";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency, cn } from "@/lib/utils";
import { WALLET_META, TRANSFERABLE_WALLETS } from "@/lib/wallet-meta";

interface WalletTxn {
  id: string;
  type: "CREDIT" | "DEBIT";
  reason: string;
  amount: string;
  description: string | null;
  createdAt: string;
}

export default function WalletPage() {
  const [wallets, setWallets] = useState<WalletCardData[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [fullName, setFullName] = useState("");
  const [planName, setPlanName] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<WalletTxn[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransfer, setShowTransfer] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("transfer") === "1"
  );
  const [transfer, setTransfer] = useState({ from: "ENGAGEMENT", to: "SALES", amount: "" });
  const [transferLoading, setTransferLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  function load() {
    apiFetch<{
      wallets: WalletCardData[];
      totalBalance: number;
      recentTransactions: WalletTxn[];
      fullName: string;
      plan: { name: string } | null;
    }>("/api/wallet")
      .then((res) => {
        setWallets(res.wallets);
        setTotalBalance(res.totalBalance);
        setTransactions(res.recentTransactions);
        setFullName(res.fullName);
        setPlanName(res.plan?.name ?? null);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function doTransfer() {
    if (!transfer.amount || Number(transfer.amount) <= 0) return toast.error("Enter a valid amount");
    setTransferLoading(true);
    try {
      await apiFetch("/api/wallet/transfer", {
        method: "POST",
        body: JSON.stringify({ from: transfer.from, to: transfer.to, amount: Number(transfer.amount) }),
      });
      toast.success("Transfer complete");
      setTransfer({ ...transfer, amount: "" });
      setShowTransfer(false);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Transfer failed");
    } finally {
      setTransferLoading(false);
    }
  }

  async function redeemPromo() {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const res = await apiFetch<{ amount: number }>("/api/promo-codes/redeem", {
        method: "POST",
        body: JSON.stringify({ code: promoCode.trim() }),
      });
      toast.success(`+${formatCurrency(res.amount)} credited from promo code`);
      setPromoCode("");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Invalid code");
    } finally {
      setPromoLoading(false);
    }
  }

  if (loading) return <p className="py-10 text-center text-sm text-foreground/50">Loading wallets…</p>;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm text-foreground/60">Total balance</p>
        <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
      </div>

      <WalletCarousel
        wallets={wallets}
        totalCard={{
          kind: "total",
          totalBalance,
          username: fullName.split(" ")[0] || "",
          planLabel: planName ?? "Free Plan",
        }}
      />

      <div className="grid grid-cols-3 gap-3">
        <Link href="/wallet/deposit" className="card flex flex-col items-center justify-center gap-1 py-3 text-xs font-semibold text-brand-primary">
          <ArrowDownLeft className="h-4 w-4" /> Deposit
        </Link>
        <Link href="/wallet/withdraw" className="card flex flex-col items-center justify-center gap-1 py-3 text-xs font-semibold text-brand-primary">
          <ArrowUpRight className="h-4 w-4" /> Withdraw
        </Link>
        <button
          onClick={() => setShowTransfer((v) => !v)}
          className="card flex flex-col items-center justify-center gap-1 py-3 text-xs font-semibold text-brand-primary"
        >
          <Repeat className="h-4 w-4" /> Transfer
        </button>
      </div>

      {showTransfer && (
        <Card>
          <CardHeader>
            <CardTitle>Transfer between wallets</CardTitle>
          </CardHeader>
          <p className="-mt-2 text-xs text-foreground/50">
            Move money between your Engagement and Sales wallets. Deposit wallet isn&apos;t part of transfers.
          </p>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={transfer.from}
                onChange={(e) => {
                  const from = e.target.value as "ENGAGEMENT" | "SALES";
                  setTransfer({ ...transfer, from, to: from === "ENGAGEMENT" ? "SALES" : "ENGAGEMENT" });
                }}
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
              >
                {TRANSFERABLE_WALLETS.map((w) => (
                  <option key={w} value={w}>
                    {WALLET_META[w].label}
                  </option>
                ))}
              </select>
              <select
                value={transfer.to}
                disabled
                className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm text-foreground/60"
              >
                {TRANSFERABLE_WALLETS.map((w) => (
                  <option key={w} value={w}>
                    {WALLET_META[w].label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              placeholder="Amount"
              type="number"
              value={transfer.amount}
              onChange={(e) => setTransfer({ ...transfer, amount: e.target.value })}
            />
            <Button loading={transferLoading} onClick={doTransfer}>
              Transfer
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Redeem promo code</CardTitle>
        </CardHeader>
        <div className="flex gap-2">
          <Input placeholder="PROMO CODE" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} />
          <Button loading={promoLoading} onClick={redeemPromo}>
            <Gift className="h-4 w-4" /> Redeem
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent transactions</CardTitle>
        </CardHeader>
        <div className="flex flex-col divide-y divide-border">
          {transactions.length === 0 && (
            <p className="py-6 text-center text-sm text-foreground/50">No transactions yet</p>
          )}
          {transactions.map((txn) => (
            <div key={txn.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">{txn.description ?? txn.reason.replaceAll("_", " ")}</p>
                <p className="text-xs text-foreground/50">{new Date(txn.createdAt).toLocaleString()}</p>
              </div>
              <span
                className={cn(
                  "text-sm font-semibold",
                  txn.type === "CREDIT" ? "text-brand-green" : "text-red-500"
                )}
              >
                {txn.type === "CREDIT" ? "+" : "-"}
                {formatCurrency(txn.amount)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

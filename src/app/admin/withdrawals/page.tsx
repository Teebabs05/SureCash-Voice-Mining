"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Check, X, PlayCircle, Zap, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency, cn } from "@/lib/utils";
import { WithdrawalStepper } from "@/components/wallet/withdrawal-stepper";

interface Withdrawal {
  id: string;
  method: string;
  amount: string;
  usdtAmount: string | null;
  fee: string;
  status: string;
  createdAt: string;
  payoutProvider: string;
  autoPayoutAttempted: boolean;
  autoPayoutError: string | null;
  user: { fullName: string; email: string };
  bankAccount: { bankName: string; accountNumber: string; accountName: string } | null;
  cryptoWallet: { address: string; network: string } | null;
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState("PENDING");

  const load = useCallback((status: string) => {
    apiFetch<{ withdrawals: Withdrawal[] }>(`/api/admin/withdrawals?status=${status}`).then((res) =>
      setWithdrawals(res.withdrawals)
    );
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  async function act(id: string, action: "approve" | "reject" | "process" | "retry-payout" | "check-crypto-status") {
    setBusyId(id);
    try {
      const res = await apiFetch<{ note?: string }>(`/api/admin/withdrawals/${id}/${action}`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      toast.success(
        action === "approve"
          ? "Withdrawal paid"
          : action === "reject"
            ? "Withdrawal rejected"
            : action === "retry-payout"
              ? "Automatic payout retried"
              : action === "check-crypto-status"
                ? (res.note ?? "Status updated")
                : "Withdrawal is now processing"
      );
      load(filter);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Withdrawals</h1>

      <div className="flex gap-2">
        {["PENDING", "PROCESSING", "PAID", "REJECTED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium",
              filter === s ? "bg-brand-purple text-white" : "bg-surface-muted text-foreground/60"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {withdrawals.length === 0 && <p className="text-sm text-foreground/50">No withdrawals found</p>}
        {withdrawals.map((w) => (
          <div key={w.id} className="card flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{w.user.fullName}</p>
                <p className="text-xs text-foreground/50">{w.user.email}</p>
                <p className="mt-1 text-sm">
                  {formatCurrency(w.amount)} (fee {formatCurrency(w.fee)})
                  {w.method === "USDT" && w.usdtAmount && (
                    <span className="ml-1 text-xs text-foreground/50">≈ {w.usdtAmount} USDT</span>
                  )}
                </p>
                {w.method === "BANK" && w.bankAccount && (
                  <p className="text-xs text-foreground/50">
                    {w.bankAccount.bankName} · {w.bankAccount.accountNumber} · {w.bankAccount.accountName}
                  </p>
                )}
                {w.method === "USDT" && w.cryptoWallet && (
                  <p className="break-all text-xs text-foreground/50">
                    USDT ({w.cryptoWallet.network}) · {w.cryptoWallet.address}
                  </p>
                )}
                {w.status === "PROCESSING" && w.payoutProvider !== "MANUAL" && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-brand-purple">
                    <Zap className="h-3 w-3" /> Auto-payout via {w.payoutProvider}
                  </p>
                )}
                {w.autoPayoutError && w.status === "PENDING" && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500">
                    <AlertTriangle className="h-3 w-3" /> Auto-payout failed: {w.autoPayoutError}
                  </p>
                )}
              </div>
              {(w.status === "PENDING" || w.status === "PROCESSING") && (
                <div className="flex flex-wrap gap-2">
                  {w.status === "PENDING" && w.autoPayoutAttempted && (
                    <Button size="sm" variant="outline" loading={busyId === w.id} onClick={() => act(w.id, "retry-payout")}>
                      <Zap className="h-3.5 w-3.5" /> Retry auto-payout
                    </Button>
                  )}
                  {w.status === "PROCESSING" && w.payoutProvider === "BINANCE" && (
                    <Button size="sm" variant="outline" loading={busyId === w.id} onClick={() => act(w.id, "check-crypto-status")}>
                      <RefreshCw className="h-3.5 w-3.5" /> Check Binance status
                    </Button>
                  )}
                  {w.status === "PENDING" && (
                    <Button size="sm" variant="outline" loading={busyId === w.id} onClick={() => act(w.id, "process")}>
                      <PlayCircle className="h-3.5 w-3.5" /> Start processing
                    </Button>
                  )}
                  <Button size="sm" loading={busyId === w.id} onClick={() => act(w.id, "approve")}>
                    <Check className="h-3.5 w-3.5" /> Mark Paid
                  </Button>
                  <Button size="sm" variant="danger" loading={busyId === w.id} onClick={() => act(w.id, "reject")}>
                    <X className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              )}
            </div>
            <WithdrawalStepper status={w.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

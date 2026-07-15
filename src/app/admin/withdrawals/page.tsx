"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency, cn } from "@/lib/utils";

interface Withdrawal {
  id: string;
  amount: string;
  fee: string;
  status: string;
  createdAt: string;
  user: { fullName: string; email: string };
  bankAccount: { bankName: string; accountNumber: string; accountName: string };
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

  async function act(id: string, action: "approve" | "reject") {
    setBusyId(id);
    try {
      await apiFetch(`/api/admin/withdrawals/${id}/${action}`, { method: "POST", body: JSON.stringify({}) });
      toast.success(`Withdrawal ${action === "approve" ? "paid" : "rejected"}`);
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
        {["PENDING", "PAID", "REJECTED"].map((s) => (
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
          <div key={w.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">{w.user.fullName}</p>
              <p className="text-xs text-foreground/50">{w.user.email}</p>
              <p className="mt-1 text-sm">
                {formatCurrency(w.amount)} (fee {formatCurrency(w.fee)})
              </p>
              <p className="text-xs text-foreground/50">
                {w.bankAccount.bankName} · {w.bankAccount.accountNumber} · {w.bankAccount.accountName}
              </p>
            </div>
            {w.status === "PENDING" && (
              <div className="flex gap-2">
                <Button size="sm" loading={busyId === w.id} onClick={() => act(w.id, "approve")}>
                  <Check className="h-3.5 w-3.5" /> Mark Paid
                </Button>
                <Button size="sm" variant="danger" loading={busyId === w.id} onClick={() => act(w.id, "reject")}>
                  <X className="h-3.5 w-3.5" /> Reject
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

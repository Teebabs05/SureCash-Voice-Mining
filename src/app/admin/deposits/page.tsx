"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency, cn } from "@/lib/utils";

interface Deposit {
  id: string;
  amount: string;
  method: string;
  status: string;
  receiptUrl: string | null;
  createdAt: string;
  user: { fullName: string; email: string };
}

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState("PENDING");

  const load = useCallback((status: string) => {
    apiFetch<{ deposits: Deposit[] }>(`/api/admin/deposits?status=${status}`).then((res) => setDeposits(res.deposits));
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  async function act(id: string, action: "approve" | "reject") {
    setBusyId(id);
    try {
      await apiFetch(`/api/admin/deposits/${id}/${action}`, { method: "POST" });
      toast.success(`Deposit ${action}d`);
      load(filter);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Deposits</h1>

      <div className="flex gap-2">
        {["PENDING", "APPROVED", "REJECTED"].map((s) => (
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
        {deposits.length === 0 && <p className="text-sm text-foreground/50">No deposits found</p>}
        {deposits.map((d) => (
          <div key={d.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">{d.user.fullName}</p>
              <p className="text-xs text-foreground/50">{d.user.email}</p>
              <p className="mt-1 text-sm">
                {formatCurrency(d.amount)} · {d.method}
              </p>
              {d.receiptUrl && (
                <Link href={d.receiptUrl} target="_blank" className="text-xs text-brand-purple underline">
                  View receipt
                </Link>
              )}
            </div>
            {d.status === "PENDING" && (
              <div className="flex gap-2">
                <Button size="sm" loading={busyId === d.id} onClick={() => act(d.id, "approve")}>
                  <Check className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button size="sm" variant="danger" loading={busyId === d.id} onClick={() => act(d.id, "reject")}>
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

"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency, cn } from "@/lib/utils";

interface Purchase {
  id: string;
  provider: string;
  serviceType: "AIRTIME" | "DATA" | "ELECTRICITY" | "CABLE_TV" | "AIRTIME_TO_CASH";
  serviceId: string;
  recipient: string;
  amount: string;
  creditAmount: string | null;
  reference: string;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "REFUNDED";
  token: string | null;
  units: string | null;
  errorMessage: string | null;
  createdAt: string;
  user: { fullName: string; email: string };
}

const STATUS_STYLE: Record<Purchase["status"], string> = {
  PENDING: "bg-surface-muted text-foreground/60",
  PROCESSING: "bg-brand-amber/15 text-[#a67c00]",
  SUCCESS: "bg-brand-green/15 text-brand-green",
  FAILED: "bg-red-500/15 text-red-500",
  REFUNDED: "bg-red-500/15 text-red-500",
};

export default function AdminBillsPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filter, setFilter] = useState("PROCESSING");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback((status: string) => {
    apiFetch<{ purchases: Purchase[] }>(`/api/admin/bills?status=${status}`).then((res) => setPurchases(res.purchases));
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  async function checkStatus(id: string) {
    setBusyId(id);
    try {
      const res = await apiFetch<{ note?: string }>(`/api/admin/bills/${id}/requery`, { method: "POST", body: JSON.stringify({}) });
      toast.success(res.note ?? "Status updated");
      load(filter);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not check status");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Bills & VTU</h1>

      <div className="flex gap-2">
        {["PENDING", "PROCESSING", "SUCCESS", "FAILED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium",
              filter === s ? "bg-brand-primary text-white" : "bg-surface-muted text-foreground/60"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {purchases.length === 0 && <p className="text-sm text-foreground/50">No purchases found</p>}
        {purchases.map((p) => (
          <div key={p.id} className="card flex flex-col gap-2 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{p.user.fullName}</p>
                <p className="text-xs text-foreground/50">{p.user.email}</p>
                <p className="mt-1 text-sm">
                  {p.serviceType} · {p.serviceId.toUpperCase()} · {p.recipient}
                </p>
                <p className="text-sm font-bold">
                  {p.serviceType === "AIRTIME_TO_CASH" ? (
                    <>
                      Sent {formatCurrency(p.amount)}
                      {p.creditAmount && <span className="ml-1 text-brand-green">· Credited {formatCurrency(p.creditAmount)}</span>}
                    </>
                  ) : (
                    formatCurrency(p.amount)
                  )}
                </p>
                <p className="text-xs text-foreground/40">
                  {p.provider} · {p.reference}
                </p>
                {p.token && (
                  <p className="mt-1 text-xs">
                    Token: <span className="font-mono font-semibold">{p.token}</span>
                    {p.units && ` · ${p.units}`}
                  </p>
                )}
                {p.errorMessage && <p className="mt-1 text-xs text-red-500">{p.errorMessage}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold", STATUS_STYLE[p.status])}>{p.status}</span>
                {(p.status === "PENDING" || p.status === "PROCESSING") && (
                  <Button size="sm" variant="outline" loading={busyId === p.id} onClick={() => checkStatus(p.id)}>
                    <RefreshCw className="h-3.5 w-3.5" /> Check status
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Smartphone, Wifi, Zap, Tv } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency, cn } from "@/lib/utils";

interface Purchase {
  id: string;
  serviceType: "AIRTIME" | "DATA" | "ELECTRICITY" | "CABLE_TV";
  serviceId: string;
  recipient: string;
  amount: string;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "REFUNDED";
  token: string | null;
  units: string | null;
  errorMessage: string | null;
  createdAt: string;
}

const SERVICE_ICON = { AIRTIME: Smartphone, DATA: Wifi, ELECTRICITY: Zap, CABLE_TV: Tv } as const;
const SERVICE_LABEL = { AIRTIME: "Airtime", DATA: "Data", ELECTRICITY: "Electricity", CABLE_TV: "Cable TV" } as const;

const STATUS_STYLE: Record<Purchase["status"], string> = {
  PENDING: "bg-surface-muted text-foreground/60",
  PROCESSING: "bg-brand-amber/15 text-[#a67c00]",
  SUCCESS: "bg-brand-green/15 text-brand-green",
  FAILED: "bg-red-500/15 text-red-500",
  REFUNDED: "bg-red-500/15 text-red-500",
};

export default function BillsHistoryPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<{ purchases: Purchase[] }>("/api/bills").then((res) => setPurchases(res.purchases));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function checkStatus(id: string) {
    setBusyId(id);
    try {
      const res = await apiFetch<{ note?: string }>(`/api/bills/${id}/requery`, { method: "POST", body: JSON.stringify({}) });
      toast.success(res.note ?? "Status updated");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not check status");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-1 text-sm text-foreground/60">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </div>
      <h1 className="text-xl font-bold">Bills & VTU history</h1>

      <div className="flex flex-col gap-3">
        {purchases.length === 0 && <p className="text-sm text-foreground/50">No purchases yet</p>}
        {purchases.map((p) => {
          const Icon = SERVICE_ICON[p.serviceType];
          return (
            <div key={p.id} className="card flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {SERVICE_LABEL[p.serviceType]} · {p.serviceId.toUpperCase()}
                    </p>
                    <p className="text-xs text-foreground/50">{p.recipient}</p>
                  </div>
                </div>
                <span className={cn("flex-none rounded-full px-2.5 py-1 text-[10px] font-bold", STATUS_STYLE[p.status])}>
                  {p.status}
                </span>
              </div>
              <p className="text-sm font-bold">{formatCurrency(p.amount)}</p>
              {p.token && (
                <p className="rounded-lg bg-surface-muted px-3 py-2 text-xs">
                  Token: <span className="font-mono font-semibold">{p.token}</span>
                  {p.units && ` · ${p.units}`}
                </p>
              )}
              {p.errorMessage && p.status === "FAILED" && <p className="text-xs text-red-500">{p.errorMessage}</p>}
              {(p.status === "PENDING" || p.status === "PROCESSING") && (
                <Button size="sm" variant="outline" loading={busyId === p.id} onClick={() => checkStatus(p.id)}>
                  <RefreshCw className="h-3.5 w-3.5" /> Check status
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

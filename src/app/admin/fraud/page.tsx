"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { apiFetch, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface FraudReport {
  id: string;
  type: string;
  details: string;
  severity: string;
  status: string;
  createdAt: string;
  user: { fullName: string; email: string };
}

const STATUSES = ["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"] as const;

export default function AdminFraudPage() {
  const [reports, setReports] = useState<FraudReport[]>([]);
  const [filter, setFilter] = useState("OPEN");

  const load = useCallback((status: string) => {
    apiFetch<{ reports: FraudReport[] }>(`/api/admin/fraud-reports?status=${status}`).then((res) => setReports(res.reports));
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  async function updateStatus(id: string, status: string) {
    try {
      await apiFetch(`/api/admin/fraud-reports/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      toast.success("Report updated");
      load(filter);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Fraud Dashboard</h1>

      <div className="flex gap-2">
        {STATUSES.map((s) => (
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
        {reports.length === 0 && <p className="text-sm text-foreground/50">No reports found</p>}
        {reports.map((r) => (
          <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    r.severity === "HIGH" || r.severity === "CRITICAL"
                      ? "bg-red-500/15 text-red-500"
                      : "bg-brand-gold/15 text-[#a67c00]"
                  )}
                >
                  {r.severity}
                </span>
                <span className="text-xs font-semibold">{r.type.replaceAll("_", " ")}</span>
              </div>
              <p className="mt-1 text-sm font-medium">{r.user.fullName}</p>
              <p className="text-xs text-foreground/50">{r.details}</p>
            </div>
            <select
              value={r.status}
              onChange={(e) => updateStatus(r.id, e.target.value)}
              className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Card>
        ))}
      </div>
    </div>
  );
}

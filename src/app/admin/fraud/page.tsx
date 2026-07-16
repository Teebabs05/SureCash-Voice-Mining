"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { ShieldAlert, Wifi, Smartphone } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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

interface Overview {
  flaggedUsers: { id: string; fullName: string; email: string; isBanned: boolean; reportCount: number }[];
  vpnDevices: { id: string; userAgent: string | null; ipAddress: string | null; lastSeenAt: string; user: { fullName: string; email: string } }[];
  multiDeviceUsers: { id: string; fullName: string; email: string; deviceCount: number }[];
}

const STATUSES = ["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"] as const;
const TABS = ["Reports", "Overview"] as const;

export default function AdminFraudPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Reports");
  const [reports, setReports] = useState<FraudReport[]>([]);
  const [filter, setFilter] = useState("OPEN");
  const [overview, setOverview] = useState<Overview | null>(null);

  const load = useCallback((status: string) => {
    apiFetch<{ reports: FraudReport[] }>(`/api/admin/fraud-reports?status=${status}`).then((res) => setReports(res.reports));
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  useEffect(() => {
    if (tab === "Overview" && !overview) {
      apiFetch<Overview>("/api/admin/fraud/overview").then(setOverview);
    }
  }, [tab, overview]);

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

      <div className="flex gap-2 rounded-xl bg-surface-muted p-1 max-w-xs">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium",
              tab === t ? "bg-surface shadow" : "text-foreground/50"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Reports" && (
        <>
          <div className="flex gap-2">
            {STATUSES.map((s) => (
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
                          : "bg-brand-amber/15 text-[#a67c00]"
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
        </>
      )}

      {tab === "Overview" && (
        <div className="flex flex-col gap-4">
          {!overview && <p className="text-sm text-foreground/50">Loading…</p>}
          {overview && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>
                    <span className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-red-500" /> Most flagged users
                    </span>
                  </CardTitle>
                </CardHeader>
                <div className="flex flex-col divide-y divide-border">
                  {overview.flaggedUsers.length === 0 && <p className="py-4 text-center text-sm text-foreground/50">No flagged users</p>}
                  {overview.flaggedUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">{u.fullName}</p>
                        <p className="text-xs text-foreground/50">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.isBanned && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-500">Banned</span>}
                        <span className="text-sm font-bold text-red-500">{u.reportCount} reports</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    <span className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-orange-500" /> VPN-suspected devices
                    </span>
                  </CardTitle>
                </CardHeader>
                <div className="flex flex-col divide-y divide-border">
                  {overview.vpnDevices.length === 0 && <p className="py-4 text-center text-sm text-foreground/50">None detected</p>}
                  {overview.vpnDevices.map((d) => (
                    <div key={d.id} className="py-3">
                      <p className="text-sm font-medium">{d.user.fullName}</p>
                      <p className="text-xs text-foreground/50">{d.ipAddress ?? "unknown IP"} · {new Date(d.lastSeenAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    <span className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-brand-primary" /> Multiple devices per user
                    </span>
                  </CardTitle>
                </CardHeader>
                <div className="flex flex-col divide-y divide-border">
                  {overview.multiDeviceUsers.length === 0 && <p className="py-4 text-center text-sm text-foreground/50">No users with 3+ devices</p>}
                  {overview.multiDeviceUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">{u.fullName}</p>
                        <p className="text-xs text-foreground/50">{u.email}</p>
                      </div>
                      <span className="text-sm font-bold text-brand-primary">{u.deviceCount} devices</span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}

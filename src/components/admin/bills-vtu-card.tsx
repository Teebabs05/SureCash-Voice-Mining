"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, ApiError } from "@/lib/api-client";
import { CredentialFieldGroups } from "@/components/admin/credential-field-group";

const VTU_PROVIDERS = ["VTU_NG", "VTUAFRICA"] as const;

export function BillsVtuCard() {
  const [defaultProvider, setDefaultProvider] = useState("VTU_NG");
  const [savingDefault, setSavingDefault] = useState(false);

  useEffect(() => {
    apiFetch<{ settings: { key: string; value: unknown }[] }>("/api/admin/settings").then((res) => {
      const row = res.settings.find((s) => s.key === "default_vtu_provider");
      if (row?.value) setDefaultProvider(String(row.value));
    });
  }, []);

  async function saveDefaultProvider(value: string) {
    setDefaultProvider(value);
    setSavingDefault(true);
    try {
      await apiFetch("/api/admin/settings", { method: "PUT", body: JSON.stringify({ key: "default_vtu_provider", value }) });
      toast.success("Default VTU provider updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save");
    } finally {
      setSavingDefault(false);
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Bills & VTU provider</CardTitle>
      </CardHeader>
      <p className="mb-3 text-xs text-foreground/50">
        SUPERADMIN only. Powers Airtime, Data, Electricity, and Cable TV purchases (Admin &gt; Bills &amp; VTU for the
        purchase queue). Keys entered here are encrypted at rest and take effect immediately (cached up to 30s),
        overriding whatever is set in the server&apos;s .env file — no redeploy needed. Airtime to Cash always uses
        VTUAfrica regardless of this switch, since VTU.ng doesn&apos;t offer that service at all.
      </p>

      <div className="mb-4 flex flex-col gap-1.5">
        <label className="text-xs font-medium text-foreground/70">Active provider (Airtime / Data / Electricity / Cable TV)</label>
        <select
          value={defaultProvider}
          disabled={savingDefault}
          onChange={(e) => saveDefaultProvider(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-primary"
        >
          {VTU_PROVIDERS.map((p) => (
            <option key={p} value={p}>
              {p.replace("_", ".")}
            </option>
          ))}
        </select>
        {defaultProvider === "VTUAFRICA" && (
          <p className="mt-1 rounded-lg bg-brand-amber/10 px-2.5 py-2 text-[11px] text-[#a67c00]">
            VTUAfrica has no live pricing for Data/Cable TV yet (those will show &quot;no plans available&quot;) and no
            pre-purchase meter/smartcard verification for Electricity/Cable TV — Airtime and Electricity purchases
            still work fully.
          </p>
        )}
      </div>

      <CredentialFieldGroups category="Bills & VTU" />
    </Card>
  );
}

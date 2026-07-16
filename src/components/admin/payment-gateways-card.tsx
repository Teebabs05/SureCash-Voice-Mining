"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, ApiError } from "@/lib/api-client";
import { CredentialFieldGroups } from "@/components/admin/credential-field-group";

const PAYOUT_PROVIDERS = ["PAYSTACK", "MONNIFY", "KORAPAY", "PAYVESSEL", "BILLSTACK", "FLUTTERWAVE"] as const;

export function PaymentGatewaysCard() {
  const [defaultProvider, setDefaultProvider] = useState("PAYSTACK");
  const [savingDefault, setSavingDefault] = useState(false);

  useEffect(() => {
    apiFetch<{ settings: { key: string; value: unknown }[] }>("/api/admin/settings").then((res) => {
      const row = res.settings.find((s) => s.key === "default_payout_provider");
      if (row?.value) setDefaultProvider(String(row.value));
    });
  }, []);

  async function saveDefaultProvider(value: string) {
    setDefaultProvider(value);
    setSavingDefault(true);
    try {
      await apiFetch("/api/admin/settings", { method: "PUT", body: JSON.stringify({ key: "default_payout_provider", value }) });
      toast.success("Default payout provider updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save");
    } finally {
      setSavingDefault(false);
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Payment gateways</CardTitle>
      </CardHeader>
      <p className="mb-3 text-xs text-foreground/50">
        SUPERADMIN only. Keys entered here are encrypted at rest and take effect immediately (cached up to 30s),
        overriding whatever is set in the server&apos;s .env file — no redeploy needed.
      </p>

      <div className="mb-4 flex flex-col gap-1.5">
        <label className="text-xs font-medium text-foreground/70">Default payout provider (for automatic withdrawals)</label>
        <select
          value={defaultProvider}
          disabled={savingDefault}
          onChange={(e) => saveDefaultProvider(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-primary"
        >
          {PAYOUT_PROVIDERS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <CredentialFieldGroups category="Payment Gateways" />
    </Card>
  );
}

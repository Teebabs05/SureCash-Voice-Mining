"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";

interface Setting {
  key: string;
  value: unknown;
}

const LIVE_SETTING_FIELDS = [
  { key: "withdrawal_min_amount", label: "Withdrawal minimum amount" },
  { key: "withdrawal_fee_percent", label: "Withdrawal fee % (base, before tier discount)" },
  { key: "withdrawal_usdt_network_fee", label: "USDT network fee (flat, on top of %)" },
  { key: "usdt_ngn_rate", label: "USDT → NGN exchange rate" },
];

const GAMIFICATION_SETTING_FIELDS = [
  { key: "mining_base_reward", label: "Mining base reward (before streak/tier bonus)" },
  { key: "referral_signup_bonus", label: "Referral signup bonus" },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ settings: Setting[] }>("/api/admin/settings").then((res) => {
      const map: Record<string, string> = {};
      for (const s of res.settings) map[s.key] = String(s.value);
      setSettings(map);
    });
  }, []);

  async function save(key: string) {
    const raw = settings[key] ?? "";
    const numeric = Number(raw);
    if (raw !== "" && Number.isNaN(numeric)) {
      return toast.error("Enter a valid number");
    }

    setLoading(key);
    try {
      await apiFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ key, value: raw === "" ? "" : numeric }),
      });
      toast.success(`${key.replaceAll("_", " ")} updated`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save setting");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Withdrawal configuration</CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-foreground/50">
          These take effect live (cached up to 30s) — read directly on every withdrawal request in
          <code className="mx-1 rounded bg-surface-muted px-1">src/lib/server/withdrawal-fee.ts</code>.
        </p>
        <div className="flex flex-col gap-3">
          {LIVE_SETTING_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-end gap-2">
              <Input
                label={label}
                type="number"
                value={settings[key] ?? ""}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
              />
              <Button size="sm" loading={loading === key} onClick={() => save(key)}>
                Save
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Mining & referral configuration</CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-foreground/50">
          Also live — read directly by
          <code className="mx-1 rounded bg-surface-muted px-1">/api/mining/claim</code>,
          <code className="mx-1 rounded bg-surface-muted px-1">/api/mining/status</code>, and
          <code className="mx-1 rounded bg-surface-muted px-1">/api/auth/register</code>.
        </p>
        <div className="flex flex-col gap-3">
          {GAMIFICATION_SETTING_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-end gap-2">
              <Input
                label={label}
                type="number"
                value={settings[key] ?? ""}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
              />
              <Button size="sm" loading={loading === key} onClick={() => save(key)}>
                Save
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

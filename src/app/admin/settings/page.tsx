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

const DEFAULT_KEYS = ["mining_base_reward", "referral_signup_bonus", "withdrawal_min_amount", "withdrawal_fee_percent"];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<{ settings: Setting[] }>("/api/admin/settings").then((res) => {
      const map: Record<string, string> = {};
      for (const s of res.settings) map[s.key] = String(s.value);
      setSettings(map);
    });
  }, []);

  async function save(key: string) {
    setLoading(true);
    try {
      await apiFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ key, value: settings[key] ?? "" }),
      });
      toast.success(`${key} saved`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save setting");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Platform configuration</CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-foreground/50">
          These are informational overrides stored for reference; wire them into the config layer to take full effect.
        </p>
        <div className="flex flex-col gap-3">
          {DEFAULT_KEYS.map((key) => (
            <div key={key} className="flex items-end gap-2">
              <Input
                label={key.replaceAll("_", " ")}
                value={settings[key] ?? ""}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
              />
              <Button size="sm" loading={loading} onClick={() => save(key)}>
                Save
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

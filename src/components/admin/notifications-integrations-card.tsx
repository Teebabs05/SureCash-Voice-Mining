"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { CredentialFieldGroups } from "@/components/admin/credential-field-group";

export function NotificationsIntegrationsCard() {
  const [supportEmail, setSupportEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    apiFetch<{ settings: { key: string; value: unknown }[] }>("/api/admin/settings").then((res) => {
      const row = res.settings.find((s) => s.key === "support_notification_email");
      if (row?.value) setSupportEmail(String(row.value));
    });
  }, []);

  async function saveSupportEmail() {
    setSavingEmail(true);
    try {
      await apiFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ key: "support_notification_email", value: supportEmail.trim() }),
      });
      toast.success("Support notification email updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save");
    } finally {
      setSavingEmail(false);
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <p className="mb-3 text-xs text-foreground/50">
        SUPERADMIN only. Real providers auto-activate as soon as their key is saved — email/SMS/WhatsApp fall back to
        console logging until then.
      </p>

      <div className="mb-4 flex flex-col gap-1.5">
        <label className="text-xs font-medium text-foreground/70">Support inbox (gets notified on manual deposit submissions)</label>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="support@surecash.app"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
          />
          <Button size="sm" loading={savingEmail} onClick={saveSupportEmail}>
            Save
          </Button>
        </div>
      </div>

      <CredentialFieldGroups category="Notifications" />
    </Card>
  );
}

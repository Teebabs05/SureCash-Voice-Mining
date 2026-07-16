"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { INTEGRATION_GROUPS } from "@/lib/integration-fields";

export interface CredentialStatus {
  key: string;
  configured: boolean;
  source: "database" | "env" | "unset";
  preview: string | null;
}

/**
 * Shared "one card per provider, one row per field" renderer used by both
 * the Payment Gateways and Notifications panels — they're the same shape
 * (masked input + Save + Clear-when-DB-backed), just filtered to a
 * different `category` from INTEGRATION_GROUPS.
 */
export function CredentialFieldGroups({ category }: { category: string }) {
  const [statuses, setStatuses] = useState<Record<string, CredentialStatus>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const groups = INTEGRATION_GROUPS.filter((g) => g.category === category);

  function load() {
    apiFetch<{ credentials: CredentialStatus[] }>("/api/admin/integrations").then((res) => {
      const map: Record<string, CredentialStatus> = {};
      for (const c of res.credentials) map[c.key] = c;
      setStatuses(map);
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function saveField(key: string) {
    const value = drafts[key]?.trim();
    if (!value) return toast.error("Enter a value first");

    setSavingKey(key);
    try {
      await apiFetch("/api/admin/integrations", { method: "PUT", body: JSON.stringify({ key, value }) });
      toast.success(`${key.replaceAll("_", " ")} saved`);
      setDrafts((d) => ({ ...d, [key]: "" }));
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save key");
    } finally {
      setSavingKey(null);
    }
  }

  async function clearField(key: string) {
    setSavingKey(key);
    try {
      await apiFetch("/api/admin/integrations", { method: "DELETE", body: JSON.stringify({ key }) });
      toast.success(`${key.replaceAll("_", " ")} cleared — falling back to .env`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not clear key");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => {
        const groupConfigured = group.fields.every((f) => statuses[f.key]?.configured);
        return (
          <div key={group.provider} className="rounded-xl border border-border p-3">
            <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
              {groupConfigured ? (
                <CheckCircle2 className="h-4 w-4 text-brand-green" />
              ) : (
                <Circle className="h-4 w-4 text-foreground/30" />
              )}
              {group.provider}
            </div>
            <div className="flex flex-col gap-2">
              {group.fields.map((field) => {
                const status = statuses[field.key];
                return (
                  <div key={field.key} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground/60">{field.label}</span>
                      {status?.configured && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            status.source === "database" ? "bg-brand-green/15 text-brand-green" : "bg-brand-amber/15 text-[#a67c00]"
                          )}
                        >
                          {status.source === "database" ? status.preview : `${status.preview} (.env)`}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        placeholder={field.placeholder || "Enter value"}
                        value={drafts[field.key] ?? ""}
                        onChange={(e) => setDrafts((d) => ({ ...d, [field.key]: e.target.value }))}
                      />
                      <Button size="sm" loading={savingKey === field.key} onClick={() => saveField(field.key)}>
                        Save
                      </Button>
                      {status?.source === "database" && (
                        <Button size="sm" variant="outline" loading={savingKey === field.key} onClick={() => clearField(field.key)}>
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, ApiError } from "@/lib/api-client";
import { CredentialFieldGroups } from "@/components/admin/credential-field-group";

const PROVIDERS = [
  { value: "stub", label: "Off (approves everything automatically — not recommended)" },
  { value: "groq", label: "Groq" },
  { value: "gemini", label: "Google Gemini" },
  { value: "whisper", label: "OpenAI Whisper" },
  { value: "azure", label: "Azure Speech" },
] as const;

export function VoiceVerificationCard() {
  const [provider, setProvider] = useState("stub");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<{ settings: { key: string; value: unknown }[] }>("/api/admin/settings").then((res) => {
      const row = res.settings.find((s) => s.key === "voice_ai_provider");
      if (row?.value) setProvider(String(row.value));
    });
  }, []);

  async function saveProvider(value: string) {
    setProvider(value);
    setSaving(true);
    try {
      await apiFetch("/api/admin/settings", { method: "PUT", body: JSON.stringify({ key: "voice_ai_provider", value }) });
      toast.success("Voice verification provider updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Voice verification</CardTitle>
      </CardHeader>
      <p className="mb-3 text-xs text-foreground/50">
        Checks that a submitted voice task recording actually matches the required prompt before approving it. This
        needs a real speech-recognition key below — without one, the system can&apos;t listen to what was said and
        every recording is approved automatically. Groq&apos;s free tier has historically not required a card at
        signup, which is usually the easiest starting point for a Nigerian card: create a key at{" "}
        <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="underline">
          console.groq.com/keys
        </a>
        , paste it below, then set the provider to Groq. (Terms can change — double-check at signup.)
      </p>

      <div className="mb-4 flex flex-col gap-1.5">
        <label className="text-xs font-medium text-foreground/70">Provider</label>
        <select
          value={provider}
          disabled={saving}
          onChange={(e) => saveProvider(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-primary"
        >
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <CredentialFieldGroups category="Voice Verification" />
    </Card>
  );
}

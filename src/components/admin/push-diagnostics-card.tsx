"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface ChannelStatus {
  configured: boolean;
  totalSubscriptions?: number;
  totalDevices?: number;
  yourSubscriptions?: number;
  yourDevices?: number;
}

interface StatusResponse {
  webPush: ChannelStatus;
  androidPush: ChannelStatus;
}

interface SendResult {
  attempted: number;
  sent: number;
  errors: string[];
}

interface TestResponse {
  webPush: SendResult;
  androidPush: SendResult;
}

function StatusRow({ label, configured, count }: { label: string; configured: boolean; count: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-foreground/70">
        {configured ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-brand-green" />
        ) : (
          <XCircle className="h-3.5 w-3.5 text-red-500" />
        )}
        {label}
      </span>
      <span className="text-foreground/50">{configured ? count : "not configured"}</span>
    </div>
  );
}

function ResultLine({ label, result }: { label: string; result: SendResult }) {
  const ok = result.sent > 0;
  return (
    <div className={cn("rounded-lg px-2.5 py-2 text-xs", ok ? "bg-brand-green/10" : "bg-red-500/10")}>
      <p className={cn("font-semibold", ok ? "text-brand-green" : "text-red-500")}>
        {label}: {result.sent}/{result.attempted} sent
      </p>
      {result.errors.length > 0 && <p className="mt-0.5 text-foreground/60">{result.errors[0]}</p>}
    </div>
  );
}

/**
 * SUPERADMIN diagnostic tool - real configuration status and an actual test
 * send through both channels, so "push isn't working" can be answered from
 * real results instead of guessing back and forth.
 */
export function PushDiagnosticsCard() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResponse | null>(null);

  function load() {
    apiFetch<StatusResponse>("/api/admin/push-test").then(setStatus);
  }

  useEffect(() => {
    load();
  }, []);

  async function sendTest() {
    setTesting(true);
    setResult(null);
    try {
      const res = await apiFetch<TestResponse>("/api/admin/push-test", { method: "POST" });
      setResult(res);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Test send failed");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Push notification status</CardTitle>
      </CardHeader>
      <p className="mb-3 text-xs text-foreground/50">
        SUPERADMIN only. Sends a real test notification to your own account through both channels.
      </p>

      {status && (
        <div className="mb-4 flex flex-col gap-2 rounded-xl bg-surface-muted p-3">
          <StatusRow
            label="Web Push (browser)"
            configured={status.webPush.configured}
            count={`${status.webPush.totalSubscriptions ?? 0} total subscription(s) · you: ${status.webPush.yourSubscriptions ?? 0}`}
          />
          <StatusRow
            label="Android push (Firebase)"
            configured={status.androidPush.configured}
            count={`${status.androidPush.totalDevices ?? 0} total device(s) · you: ${status.androidPush.yourDevices ?? 0}`}
          />
        </div>
      )}

      <Button size="sm" loading={testing} onClick={sendTest}>
        Send test notification to me
      </Button>

      {result && (
        <div className="mt-3 flex flex-col gap-2">
          <ResultLine label="Web Push" result={result.webPush} />
          <ResultLine label="Android push" result={result.androidPush} />
        </div>
      )}
    </Card>
  );
}

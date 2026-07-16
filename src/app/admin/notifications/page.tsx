"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const SEGMENTS = [
  { value: "ALL", label: "All users", description: "Every registered user" },
  { value: "VIP", label: "VIP tier", description: "Users on the VIP membership tier" },
  { value: "NEW", label: "New users", description: "Joined in the last 7 days" },
  { value: "INACTIVE", label: "Inactive users", description: "No wallet activity in 14+ days" },
] as const;

export default function AdminNotificationsPage() {
  const [form, setForm] = useState({ title: "", body: "" });
  const [segment, setSegment] = useState<(typeof SEGMENTS)[number]["value"]>("ALL");
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    try {
      const res = await apiFetch<{ recipientCount: number | null }>("/api/admin/notifications/broadcast", {
        method: "POST",
        body: JSON.stringify({ ...form, segment }),
      });
      toast.success(
        res.recipientCount === null
          ? "Broadcast sent to all users"
          : `Sent to ${res.recipientCount} user(s) in the ${segment} segment`
      );
      setForm({ title: "", body: "" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send broadcast");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Notifications</h1>
      <Card className="max-w-lg">
        <p className="mb-3 text-sm text-foreground/60">Send a broadcast notification to a segment of users.</p>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            {SEGMENTS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSegment(s.value)}
                className={cn(
                  "rounded-xl border p-3 text-left text-xs",
                  segment === s.value ? "border-brand-primary bg-brand-primary/5" : "border-border"
                )}
              >
                <p className="font-semibold">{s.label}</p>
                <p className="text-foreground/50">{s.description}</p>
              </button>
            ))}
          </div>
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Message" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <Button loading={loading} onClick={send}>
            Send broadcast
          </Button>
        </div>
      </Card>
    </div>
  );
}

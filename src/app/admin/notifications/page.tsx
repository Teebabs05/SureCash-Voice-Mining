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

function SegmentPicker({
  value,
  onChange,
}: {
  value: (typeof SEGMENTS)[number]["value"];
  onChange: (v: (typeof SEGMENTS)[number]["value"]) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {SEGMENTS.map((s) => (
        <button
          key={s.value}
          onClick={() => onChange(s.value)}
          className={cn(
            "rounded-xl border p-3 text-left text-xs",
            value === s.value ? "border-brand-primary bg-brand-primary/5" : "border-border"
          )}
        >
          <p className="font-semibold">{s.label}</p>
          <p className="text-foreground/50">{s.description}</p>
        </button>
      ))}
    </div>
  );
}

export default function AdminNotificationsPage() {
  const [pushForm, setPushForm] = useState({ title: "", body: "" });
  const [pushSegment, setPushSegment] = useState<(typeof SEGMENTS)[number]["value"]>("ALL");
  const [pushLoading, setPushLoading] = useState(false);

  const [emailForm, setEmailForm] = useState({ subject: "", message: "" });
  const [emailSegment, setEmailSegment] = useState<(typeof SEGMENTS)[number]["value"]>("ALL");
  const [emailLoading, setEmailLoading] = useState(false);

  async function sendPush() {
    setPushLoading(true);
    try {
      const res = await apiFetch<{ recipientCount: number | null }>("/api/admin/notifications/broadcast", {
        method: "POST",
        body: JSON.stringify({ ...pushForm, segment: pushSegment }),
      });
      toast.success(
        res.recipientCount === null
          ? "Broadcast sent to all users"
          : `Sent to ${res.recipientCount} user(s) in the ${pushSegment} segment`
      );
      setPushForm({ title: "", body: "" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send broadcast");
    } finally {
      setPushLoading(false);
    }
  }

  async function sendEmail() {
    setEmailLoading(true);
    try {
      const res = await apiFetch<{ recipientCount: number }>("/api/admin/notifications/broadcast-email", {
        method: "POST",
        body: JSON.stringify({ ...emailForm, segment: emailSegment }),
      });
      toast.success(`Queued for ${res.recipientCount} user(s) in the ${emailSegment} segment`);
      setEmailForm({ subject: "", message: "" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send email");
    } finally {
      setEmailLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Notifications</h1>

      <Card className="max-w-lg">
        <p className="mb-3 text-sm font-semibold">Push notification</p>
        <p className="mb-3 text-sm text-foreground/60">Send an in-app + push notification to a segment of users.</p>
        <div className="flex flex-col gap-3">
          <SegmentPicker value={pushSegment} onChange={setPushSegment} />
          <Input label="Title" value={pushForm.title} onChange={(e) => setPushForm({ ...pushForm, title: e.target.value })} />
          <Input label="Message" value={pushForm.body} onChange={(e) => setPushForm({ ...pushForm, body: e.target.value })} />
          <Button loading={pushLoading} onClick={sendPush}>
            Send broadcast
          </Button>
        </div>
      </Card>

      <Card className="max-w-lg">
        <p className="mb-3 text-sm font-semibold">Bulk email</p>
        <p className="mb-3 text-sm text-foreground/60">Email a segment of users directly from the platform.</p>
        <div className="flex flex-col gap-3">
          <SegmentPicker value={emailSegment} onChange={setEmailSegment} />
          <Input
            label="Subject"
            value={emailForm.subject}
            onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
          />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground/70">Message</span>
            <textarea
              rows={5}
              value={emailForm.message}
              onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
              className="rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-primary"
            />
          </label>
          <Button loading={emailLoading} onClick={sendEmail}>
            Send email
          </Button>
        </div>
      </Card>
    </div>
  );
}

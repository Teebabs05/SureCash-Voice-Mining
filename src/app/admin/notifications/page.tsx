"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";

export default function AdminNotificationsPage() {
  const [form, setForm] = useState({ title: "", body: "" });
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    try {
      await apiFetch("/api/admin/notifications/broadcast", { method: "POST", body: JSON.stringify(form) });
      toast.success("Broadcast sent to all users");
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
        <p className="mb-3 text-sm text-foreground/60">Send a broadcast notification to every user.</p>
        <div className="flex flex-col gap-3">
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

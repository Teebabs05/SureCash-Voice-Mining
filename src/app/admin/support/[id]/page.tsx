"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Reply {
  id: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
}
interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  user: { fullName: string; email: string };
  replies: Reply[];
}

export default function AdminTicketPage() {
  const params = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    apiFetch<{ ticket: Ticket }>(`/api/admin/support/${params.id}`).then((res) => setTicket(res.ticket));
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function reply() {
    if (!message.trim()) return;
    setLoading(true);
    try {
      await apiFetch(`/api/admin/support/${params.id}/reply`, { method: "POST", body: JSON.stringify({ message }) });
      setMessage("");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send reply");
    } finally {
      setLoading(false);
    }
  }

  async function close() {
    try {
      await apiFetch(`/api/admin/support/${params.id}`, { method: "PATCH", body: JSON.stringify({ status: "CLOSED" }) });
      toast.success("Ticket closed");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    }
  }

  if (!ticket) return <p className="text-sm text-foreground/50">Loading…</p>;

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{ticket.subject}</h1>
          <p className="text-xs text-foreground/50">
            {ticket.user.fullName} · {ticket.user.email}
          </p>
        </div>
        {ticket.status !== "CLOSED" && (
          <Button size="sm" variant="outline" onClick={close}>
            Close ticket
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="card p-3 text-sm">{ticket.message}</div>
        {ticket.replies.map((r) => (
          <div
            key={r.id}
            className={cn("max-w-[85%] rounded-2xl p-3 text-sm", r.isAdmin ? "self-end gradient-brand text-white" : "self-start bg-brand-primary/10")}
          >
            <p className="mb-1 text-[10px] font-semibold opacity-70">{r.isAdmin ? "Support" : ticket.user.fullName}</p>
            {r.message}
          </div>
        ))}
      </div>

      {ticket.status !== "CLOSED" && (
        <div className="flex gap-2">
          <Input placeholder="Reply to user…" value={message} onChange={(e) => setMessage(e.target.value)} />
          <Button loading={loading} onClick={reply}>
            Send
          </Button>
        </div>
      )}
    </div>
  );
}

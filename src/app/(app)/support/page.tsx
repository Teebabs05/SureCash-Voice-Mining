"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, MessageCircle, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  updatedAt: string;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    apiFetch<{ tickets: Ticket[] }>("/api/support/tickets").then((res) => setTickets(res.tickets));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createTicket() {
    if (!form.subject.trim() || !form.message.trim()) return toast.error("Fill in both fields");
    setLoading(true);
    try {
      await apiFetch("/api/support/tickets", { method: "POST", body: JSON.stringify(form) });
      toast.success("Ticket created");
      setForm({ subject: "", message: "" });
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Support</h1>
        <p className="text-sm text-foreground/60">Get help from the SureCash Mining team.</p>
      </div>

      <Link href="/faq" className="card flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
          <HelpCircle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">FAQ</p>
          <p className="text-xs text-foreground/50">Common questions answered</p>
        </div>
      </Link>

      {showForm ? (
        <Card>
          <div className="flex flex-col gap-2">
            <Input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <Input placeholder="Describe your issue" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            <Button loading={loading} onClick={createTicket}>
              Submit ticket
            </Button>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-border py-2.5 text-sm text-brand-purple"
        >
          <Plus className="h-4 w-4" /> New support ticket
        </button>
      )}

      <div className="flex flex-col gap-2">
        {tickets.map((t) => (
          <Link key={t.id} href={`/support/${t.id}`} className="card flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-foreground/40" />
              <div>
                <p className="text-sm font-medium">{t.subject}</p>
                <p className="text-xs text-foreground/50">{new Date(t.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                t.status === "OPEN" && "bg-brand-gold/15 text-[#a67c00]",
                t.status === "ANSWERED" && "bg-brand-green/15 text-brand-green",
                t.status === "CLOSED" && "bg-surface-muted text-foreground/50"
              )}
            >
              {t.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

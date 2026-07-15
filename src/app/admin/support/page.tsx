"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  updatedAt: string;
  user: { fullName: string; email: string };
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    apiFetch<{ tickets: Ticket[] }>("/api/admin/support").then((res) => setTickets(res.tickets));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Support Tickets</h1>
      <div className="flex flex-col gap-2">
        {tickets.length === 0 && <p className="text-sm text-foreground/50">No tickets yet</p>}
        {tickets.map((t) => (
          <Link key={t.id} href={`/admin/support/${t.id}`}>
            <Card className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{t.subject}</p>
                <p className="text-xs text-foreground/50">
                  {t.user.fullName} · {t.user.email}
                </p>
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
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

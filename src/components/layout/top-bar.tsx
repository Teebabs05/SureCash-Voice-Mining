"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

export function TopBar({ title }: { title: string }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    apiFetch<{ unreadCount: number }>("/api/notifications?unreadOnly=1&countOnly=1")
      .then((res) => setUnread(res.unreadCount))
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3.5 backdrop-blur">
      <span className="text-lg font-bold text-brand-purple">{title}</span>
      <Link href="/profile/notifications" className="relative rounded-full p-2 hover:bg-surface-muted">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-gold text-[10px] font-bold text-[#3a2c00]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
    </header>
  );
}

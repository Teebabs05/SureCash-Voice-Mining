"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    apiFetch<{ notifications: Notification[] }>("/api/notifications").then((res) => setNotifications(res.notifications));
    apiFetch("/api/notifications/read-all", { method: "POST" }).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-foreground/60">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-xl font-bold">Notifications</h1>

      {notifications.length === 0 && (
        <p className="py-10 text-center text-sm text-foreground/50">No notifications yet</p>
      )}

      <div className="flex flex-col gap-2">
        {notifications.map((n) => (
          <div key={n.id} className={cn("card flex gap-3 p-4", !n.isRead && "border border-brand-purple/30")}>
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">{n.title}</p>
              <p className="text-xs text-foreground/60">{n.body}</p>
              <p className="mt-1 text-[10px] text-foreground/40">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, BellRing } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getPushSubscriptionState, enablePushNotifications, disablePushNotifications } from "@/lib/push-client";

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
  const [pushState, setPushState] = useState<"unsupported" | "subscribed" | "unsubscribed">("unsubscribed");
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    apiFetch<{ notifications: Notification[] }>("/api/notifications").then((res) => setNotifications(res.notifications));
    apiFetch("/api/notifications/read-all", { method: "POST" }).catch(() => {});
    getPushSubscriptionState().then(setPushState);
  }, []);

  async function togglePush() {
    setPushLoading(true);
    try {
      if (pushState === "subscribed") {
        await disablePushNotifications();
        setPushState("unsubscribed");
        toast.success("Push notifications disabled");
      } else {
        await enablePushNotifications();
        setPushState("subscribed");
        toast.success("Push notifications enabled");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update push notifications");
    } finally {
      setPushLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-foreground/60">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-xl font-bold">Notifications</h1>

      {pushState !== "unsupported" && (
        <div className="card flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
              <BellRing className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Push notifications</p>
              <p className="text-xs text-foreground/60">Get alerts on this device even when the app is closed.</p>
            </div>
          </div>
          <Button
            size="sm"
            variant={pushState === "subscribed" ? "danger" : "primary"}
            loading={pushLoading}
            onClick={togglePush}
          >
            {pushState === "subscribed" ? "Disable" : "Enable"}
          </Button>
        </div>
      )}

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

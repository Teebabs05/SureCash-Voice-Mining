"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, BellRing, Mail, LogIn } from "lucide-react";
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
  // iOS Safari never exposes the Push API unless the site was installed via
  // "Add to Home Screen" first (and even then, needs iOS 16.4+) - it's
  // otherwise indistinguishable from "this browser doesn't support push at
  // all", so detect that specific case to explain it instead of just hiding
  // the whole section with no explanation. Computed once at mount (not in an
  // effect) since it never changes for the lifetime of the page.
  const [needsHomeScreenInstall] = useState(() => {
    if (typeof window === "undefined") return false;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    return isIos && !isStandalone;
  });
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailLoading, setEmailLoading] = useState(false);
  const [loginAlertsEnabled, setLoginAlertsEnabled] = useState(true);
  const [loginAlertsLoading, setLoginAlertsLoading] = useState(false);

  useEffect(() => {
    apiFetch<{ notifications: Notification[] }>("/api/notifications").then((res) => setNotifications(res.notifications));
    apiFetch("/api/notifications/read-all", { method: "POST" }).catch(() => {});
    getPushSubscriptionState().then(setPushState);
    apiFetch<{ emailNotificationsEnabled: boolean; loginAlertsEnabled: boolean }>("/api/profile/notification-settings")
      .then((res) => {
        setEmailEnabled(res.emailNotificationsEnabled);
        setLoginAlertsEnabled(res.loginAlertsEnabled);
      })
      .catch(() => {});
  }, []);

  async function toggleEmail() {
    const next = !emailEnabled;
    setEmailLoading(true);
    try {
      await apiFetch("/api/profile/notification-settings", {
        method: "PATCH",
        body: JSON.stringify({ emailNotificationsEnabled: next }),
      });
      setEmailEnabled(next);
      toast.success(next ? "Wallet activity emails enabled" : "Wallet activity emails disabled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update wallet activity emails");
    } finally {
      setEmailLoading(false);
    }
  }

  async function toggleLoginAlerts() {
    const next = !loginAlertsEnabled;
    setLoginAlertsLoading(true);
    try {
      await apiFetch("/api/profile/notification-settings", {
        method: "PATCH",
        body: JSON.stringify({ loginAlertsEnabled: next }),
      });
      setLoginAlertsEnabled(next);
      toast.success(next ? "Login alerts enabled" : "Login alerts disabled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update login alerts");
    } finally {
      setLoginAlertsLoading(false);
    }
  }

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

      <div className="card flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Wallet activity emails</p>
            <p className="text-xs text-foreground/60">Get emailed for deposits, withdrawals, and earnings.</p>
          </div>
        </div>
        <Button
          size="sm"
          variant={emailEnabled ? "danger" : "primary"}
          loading={emailLoading}
          onClick={toggleEmail}
        >
          {emailEnabled ? "Disable" : "Enable"}
        </Button>
      </div>

      <div className="card flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
            <LogIn className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Login alerts</p>
            <p className="text-xs text-foreground/60">Get emailed whenever your account is signed in to.</p>
          </div>
        </div>
        <Button
          size="sm"
          variant={loginAlertsEnabled ? "danger" : "primary"}
          loading={loginAlertsLoading}
          onClick={toggleLoginAlerts}
        >
          {loginAlertsEnabled ? "Disable" : "Enable"}
        </Button>
      </div>

      {needsHomeScreenInstall ? (
        <div className="card flex items-start gap-3 p-4">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
            <BellRing className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Push notifications</p>
            <p className="text-xs text-foreground/60">
              iPhone Safari only supports push notifications for sites installed to your Home Screen. Tap the{" "}
              <strong>Share</strong> button, then <strong>&quot;Add to Home Screen&quot;</strong>, then open SureCash
              Mining from that new icon and come back to this page to enable them.
            </p>
          </div>
        </div>
      ) : (
        pushState !== "unsupported" && (
          <div className="card flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
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
        )
      )}

      {notifications.length === 0 && (
        <p className="py-10 text-center text-sm text-foreground/50">No notifications yet</p>
      )}

      <div className="flex flex-col gap-2">
        {notifications.map((n) => (
          <div key={n.id} className={cn("card flex gap-3 p-4", !n.isRead && "border border-brand-primary/30")}>
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
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

import { apiFetch } from "@/lib/api-client";

function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function getPushSubscriptionState(): Promise<"unsupported" | "subscribed" | "unsubscribed"> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported";
  }
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  return existing ? "subscribed" : "unsubscribed";
}

export async function enablePushNotifications() {
  const { publicKey } = await apiFetch<{ publicKey: string | null }>("/api/push/vapid-public-key");
  if (!publicKey) throw new Error("Push notifications aren't configured on this server yet");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission was denied");

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });

  const json = subscription.toJSON();
  await apiFetch("/api/push/subscribe", {
    method: "POST",
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });
}

export async function disablePushNotifications() {
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (!existing) return;

  const endpoint = existing.endpoint;
  await existing.unsubscribe();
  await apiFetch("/api/push/subscribe", { method: "DELETE", body: JSON.stringify({ endpoint }) });
}

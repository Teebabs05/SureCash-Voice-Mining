"use client";

import { useEffect } from "react";
import { apiFetch } from "@/lib/api-client";

/**
 * The Android app's WebView (MainActivity.kt -> fetchAndRegisterPushToken)
 * calls window.SureCashMiningApp.registerPushToken(token) after every page
 * load with its current Firebase Cloud Messaging token. That function has
 * to exist here for the call to go anywhere - this just forwards it to the
 * server. A no-op everywhere else (regular browsers never call it).
 */
export function AndroidPushBridge() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as unknown as { SureCashMiningApp?: { registerPushToken: (token: string) => void } }).SureCashMiningApp = {
      registerPushToken: (token: string) => {
        apiFetch("/api/push/register-device", {
          method: "POST",
          body: JSON.stringify({ token, platform: "android" }),
        }).catch(() => {});
      },
    };
  }, []);

  return null;
}

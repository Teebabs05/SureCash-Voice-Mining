"use client";

import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failures (e.g. unsupported browser) are non-fatal — the
      // app works fully without the service worker, just without offline/PWA install support.
    });
  }, []);

  return null;
}

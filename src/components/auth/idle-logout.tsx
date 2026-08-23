"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

const IDLE_TIMEOUT_MS = 60 * 60 * 1000;
const WARNING_BEFORE_MS = 60 * 1000;
const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "touchstart", "scroll", "wheel"] as const;
const STORAGE_KEY = "surecash_last_activity";

/**
 * Auto-logs out after 1 hour of no interaction, for account security on
 * shared/public devices. Activity is tracked via localStorage (not just
 * local timers) so it's shared across every open tab - moving the mouse in
 * one tab resets the idle clock for all of them, and an idle tab still gets
 * signed out even if it never scrolls or gets focus itself.
 */
export function IdleLogout() {
  const warnedRef = useRef(false);
  const loggingOutRef = useRef(false);

  useEffect(() => {
    function recordActivity() {
      warnedRef.current = false;
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }

    recordActivity();
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, recordActivity, { passive: true });
    }

    async function logout() {
      if (loggingOutRef.current) return;
      loggingOutRef.current = true;
      try {
        await apiFetch("/api/auth/logout", { method: "POST" });
      } catch {
        // Best-effort - still redirect even if the request itself fails,
        // since the goal is getting an idle session off the screen.
      }
      window.location.assign("/login?reason=idle");
    }

    const interval = setInterval(() => {
      const lastActivity = Number(localStorage.getItem(STORAGE_KEY) ?? Date.now());
      const idleFor = Date.now() - lastActivity;

      if (idleFor >= IDLE_TIMEOUT_MS) {
        logout();
      } else if (idleFor >= IDLE_TIMEOUT_MS - WARNING_BEFORE_MS && !warnedRef.current) {
        warnedRef.current = true;
        toast.warning("You'll be logged out in a minute due to inactivity", { duration: WARNING_BEFORE_MS });
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, recordActivity);
      }
    };
  }, []);

  return null;
}

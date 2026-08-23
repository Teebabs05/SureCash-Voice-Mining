"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api-client";

export function ImpersonationBanner({ userName }: { userName: string }) {
  const [loading, setLoading] = useState(false);

  async function returnToAdmin() {
    setLoading(true);
    try {
      await apiFetch("/api/admin/impersonate/stop", { method: "POST" });
      window.location.assign("/admin/users");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not return to admin");
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 bg-brand-amber px-4 py-2 text-xs font-semibold text-black">
      <span className="flex items-center gap-1.5 truncate">
        <Eye className="h-3.5 w-3.5 shrink-0" /> Viewing as {userName}
      </span>
      <button
        onClick={returnToAdmin}
        disabled={loading}
        className="shrink-0 rounded-full bg-black/10 px-3 py-1 disabled:opacity-60"
      >
        {loading ? "…" : "Return to Admin"}
      </button>
    </div>
  );
}

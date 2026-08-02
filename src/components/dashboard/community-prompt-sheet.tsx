"use client";

import { Users, MessageCircle, Send, X } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface CommunityPromptSheetProps {
  whatsappUrl: string;
  telegramUrl: string;
  onClose: () => void;
}

export function CommunityPromptSheet({ whatsappUrl, telegramUrl, onClose }: CommunityPromptSheetProps) {
  function dismiss() {
    apiFetch("/api/community-prompt", { method: "POST" }).catch(() => {});
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/50" onClick={dismiss} />
      <div className="relative w-full rounded-t-3xl bg-surface px-6 pb-8 pt-3 shadow-xl">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />
        <button onClick={dismiss} className="absolute right-4 top-5 rounded-full p-1.5 hover:bg-surface-muted">
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-brand text-white">
            <Users className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-xl font-bold">Join our community</h2>
          <p className="mt-2 text-sm text-foreground/60">
            Get updates, tips, and connect with other members earning on SureCash Mining.
          </p>

          <div className="mt-6 flex w-full flex-col gap-2.5">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                onClick={dismiss}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-bold text-white"
              >
                <MessageCircle className="h-4 w-4" /> Join WhatsApp group
              </a>
            )}
            {telegramUrl && (
              <a
                href={telegramUrl}
                target="_blank"
                rel="noreferrer"
                onClick={dismiss}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#26A5E4] text-sm font-bold text-white"
              >
                <Send className="h-4 w-4" /> Join Telegram
              </a>
            )}
          </div>

          <button onClick={dismiss} className="mt-3 text-xs text-foreground/40">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

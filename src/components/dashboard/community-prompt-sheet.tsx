"use client";

import { Megaphone, MessageCircle, Send } from "lucide-react";
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
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-border" />

        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full gradient-brand opacity-25 blur-xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full gradient-brand text-white">
              <Megaphone className="h-8 w-8" />
            </div>
          </div>

          <h2 className="mt-5 text-2xl font-bold">Join our community!</h2>
          <p className="mt-2 text-sm text-foreground/60">
            Get payment proofs, new task alerts, and announcements first — join our WhatsApp group and Telegram
            channel.
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
                <MessageCircle className="h-4 w-4" /> Join WhatsApp Group
              </a>
            )}
            {telegramUrl && (
              <a
                href={telegramUrl}
                target="_blank"
                rel="noreferrer"
                onClick={dismiss}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#26A5E4]/10 text-sm font-bold text-[#1a8cc9]"
              >
                <Send className="h-4 w-4" /> Join Telegram Channel
              </a>
            )}
          </div>

          <button
            onClick={dismiss}
            className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground/70"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

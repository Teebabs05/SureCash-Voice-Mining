"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "How do I earn on SureCash Mining?",
    a: "You can earn through daily mining, voice tasks, the task center, referrals, and the daily lucky spin. Each source credits its own wallet.",
  },
  {
    q: "Why do I need to verify my email?",
    a: "Email verification protects your account and unlocks mining, voice tasks, task rewards, and withdrawals.",
  },
  {
    q: "How are voice recordings validated?",
    a: "Recordings are checked by AI for accuracy and authenticity, including duplicate detection, replay-attack detection, background noise, and synthesized-voice detection. Only recordings that pass are rewarded.",
  },
  {
    q: "How long do withdrawals take?",
    a: "Withdrawals are reviewed and paid out by our team. Higher membership tiers get reduced withdrawal fees.",
  },
  {
    q: "What are membership tiers?",
    a: "Free, Silver, Gold, and VIP tiers increase your daily voice-task limits, mining rewards, and reduce withdrawal fees.",
  },
  {
    q: "How does the referral program work?",
    a: "Share your referral link. When someone signs up and verifies their email you get a signup bonus, plus an ongoing commission whenever they earn.",
  },
];

export default function FaqPage() {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-foreground/60">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-xl font-bold">Frequently Asked Questions</h1>

      <div className="flex flex-col gap-2">
        {FAQS.map((item, i) => (
          <div key={i} className="card overflow-hidden p-0">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between p-4 text-left text-sm font-medium"
            >
              {item.q}
              <ChevronDown className={cn("h-4 w-4 flex-none transition-transform", open === i && "rotate-180")} />
            </button>
            {open === i && <p className="px-4 pb-4 text-sm text-foreground/60">{item.a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

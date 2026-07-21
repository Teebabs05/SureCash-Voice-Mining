"use client";

import type { LucideIcon } from "lucide-react";
import { CheckSquare, Sparkles } from "lucide-react";

export type ComingSoonColor = "primary" | "green" | "amber" | "red";

export interface ComingSoonFeature {
  icon: LucideIcon;
  title: string;
  description: string;
  color: ComingSoonColor;
}

const COLOR_CLASSES: Record<ComingSoonColor, { solid: string; ring: string }> = {
  primary: { solid: "bg-brand-primary", ring: "border-brand-primary/30" },
  green: { solid: "bg-brand-green", ring: "border-brand-green/30" },
  amber: { solid: "bg-brand-amber", ring: "border-brand-amber/40" },
  red: { solid: "bg-red-500", ring: "border-red-500/30" },
};

export function ComingSoonSheet({ feature, onClose }: { feature: ComingSoonFeature | null; onClose: () => void }) {
  if (!feature) return null;
  const { icon: Icon, title, description, color } = feature;
  const { solid, ring } = COLOR_CLASSES[color];

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full rounded-t-3xl bg-surface px-6 pb-8 pt-3 shadow-xl">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />

        <div className="flex flex-col items-center text-center">
          <div className={`flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed ${ring}`}>
            <div className={`flex h-20 w-20 items-center justify-center rounded-full text-white ${solid}`}>
              <Icon className="h-8 w-8" />
            </div>
          </div>

          <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-brand-amber/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#a67c00]">
            <Sparkles className="h-3.5 w-3.5" /> Coming soon
          </span>

          <h2 className="mt-3 text-xl font-bold">{title}</h2>
          <p className="mt-2 text-sm text-foreground/60">{description}</p>

          <button
            onClick={onClose}
            className={`mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white ${solid}`}
          >
            <CheckSquare className="h-4 w-4" /> Got it
          </button>

          <p className="mt-3 text-xs text-foreground/40">You will be notified the moment it goes live</p>
        </div>
      </div>
    </div>
  );
}

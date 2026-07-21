"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ComingSoonSheet, type ComingSoonColor } from "@/components/dashboard/coming-soon-sheet";

interface ArcItem {
  label: string;
  icon: LucideIcon;
  iconClass: string;
  color: ComingSoonColor;
  description: string;
  raised: boolean;
}

const DIP_OFFSET = 44;

export function BillPaymentsArc({ items }: { items: ArcItem[] }) {
  const [selected, setSelected] = useState<ArcItem | null>(null);

  return (
    <div className="relative" style={{ minHeight: 90 + DIP_OFFSET }}>
      <svg
        viewBox="0 0 400 90"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-2 top-9 h-14 w-[calc(100%-1rem)] text-border"
      >
        <path d="M10,10 C110,85 290,85 390,10" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <div className="relative flex items-start justify-between">
        {items.map((item) => {
          const { label, icon: Icon, iconClass, raised } = item;
          return (
            <button
              key={label}
              onClick={() => setSelected(item)}
              className="flex flex-col items-center gap-1.5 transition-transform active:scale-95"
              style={{ transform: `translateY(${raised ? 0 : DIP_OFFSET}px)` }}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-full ${iconClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-foreground/70">{label}</span>
            </button>
          );
        })}
      </div>

      <ComingSoonSheet
        feature={
          selected
            ? { icon: selected.icon, title: selected.label, description: selected.description, color: selected.color }
            : null
        }
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

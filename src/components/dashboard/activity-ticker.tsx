"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface ActivityEvent {
  id: string;
  text: string;
}

export function ActivityTicker() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    apiFetch<{ events: ActivityEvent[] }>("/api/activity").then((res) => setEvents(res.events));
  }, []);

  useEffect(() => {
    if (events.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % events.length), 4000);
    return () => clearInterval(id);
  }, [events.length]);

  const text = events[index]?.text ?? "Welcome to SureCash Mining — start earning today!";

  return (
    <div className="flex items-center gap-2 overflow-hidden rounded-full bg-surface-muted px-3 py-2 text-xs text-foreground/60">
      <Sparkles className="h-3.5 w-3.5 flex-none text-brand-amber" />
      <span key={index} className="truncate">
        {text}
      </span>
    </div>
  );
}

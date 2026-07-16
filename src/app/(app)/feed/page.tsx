"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Banknote, Mic, Trophy, Users } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface FeedEvent {
  id: string;
  icon: "withdrawal" | "voice" | "achievement" | "referral";
  text: string;
  createdAt: string;
}

const ICONS = { withdrawal: Banknote, voice: Mic, achievement: Trophy, referral: Users };

export default function FeedPage() {
  const router = useRouter();
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ events: FeedEvent[] }>("/api/feed")
      .then((res) => setEvents(res.events))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-foreground/60">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div>
        <h1 className="text-xl font-bold">Community Feed</h1>
        <p className="text-sm text-foreground/60">Real activity happening across SureCash Mining.</p>
      </div>

      {loading && <p className="py-10 text-center text-sm text-foreground/50">Loading…</p>}
      {!loading && events.length === 0 && (
        <p className="py-10 text-center text-sm text-foreground/50">
          No activity yet — be the first to earn today!
        </p>
      )}

      <div className="flex flex-col gap-2">
        {events.map((e) => {
          const Icon = ICONS[e.icon];
          return (
            <div key={e.id} className="card flex items-center gap-3 p-3">
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm">{e.text}</p>
                <p className="text-[10px] text-foreground/40">{new Date(e.createdAt).toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

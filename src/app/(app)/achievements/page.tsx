"use client";

import { useEffect, useState } from "react";
import { Trophy, Lock } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt: string | null;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    apiFetch<{ achievements: Achievement[] }>("/api/achievements").then((res) => setAchievements(res.achievements));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Achievements</h1>
        <p className="text-sm text-foreground/60">Unlock badges as you earn, mine, and invite friends.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {achievements.map((a) => (
          <div
            key={a.id}
            className={cn(
              "card flex flex-col items-center gap-2 p-4 text-center",
              !a.earned && "opacity-50"
            )}
          >
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full",
                a.earned ? "gradient-gold text-[#3a2c00]" : "bg-surface-muted text-foreground/40"
              )}
            >
              {a.earned ? <Trophy className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
            </div>
            <p className="text-sm font-semibold">{a.title}</p>
            <p className="text-xs text-foreground/50">{a.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

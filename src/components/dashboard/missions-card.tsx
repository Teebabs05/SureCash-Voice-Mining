"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Mission {
  id: string;
  title: string;
  target: number;
  progress: number;
  completed: boolean;
}

export function MissionsCard() {
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    apiFetch<{ missions: Mission[] }>("/api/missions").then((res) => setMissions(res.missions));
  }, []);

  if (missions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Missions</CardTitle>
      </CardHeader>
      <div className="flex flex-col gap-3">
        {missions.map((m) => (
          <div key={m.id} className="flex items-center gap-3">
            {m.completed ? (
              <CheckCircle2 className="h-5 w-5 flex-none text-brand-green" />
            ) : (
              <Circle className="h-5 w-5 flex-none text-foreground/20" />
            )}
            <div className="flex-1">
              <p className={cn("text-sm font-medium", m.completed && "text-foreground/50 line-through")}>
                {m.title}
              </p>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full gradient-brand"
                  style={{ width: `${Math.min(100, (m.progress / m.target) * 100)}%` }}
                />
              </div>
            </div>
            <span className="flex-none text-xs text-foreground/40">
              {Math.min(m.progress, m.target)}/{m.target}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

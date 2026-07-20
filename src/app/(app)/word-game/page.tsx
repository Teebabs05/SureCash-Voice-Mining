"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { BookOpen, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { WordGameRecorder } from "@/components/word-game/recorder";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, cn } from "@/lib/utils";

interface WordGameTask {
  id: string;
  title: string;
  promptText: string;
  rewardAmount: string;
  dailyLimit: number;
  minDuration: number;
  maxDuration: number;
  completedToday: number;
}

export default function WordGamePage() {
  const [tasks, setTasks] = useState<WordGameTask[]>([]);
  const [planRequired, setPlanRequired] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    apiFetch<{ tasks: WordGameTask[]; planRequired: boolean }>("/api/voice/tasks?category=word_game")
      .then((res) => {
        setTasks(res.tasks);
        setPlanRequired(res.planRequired);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="py-10 text-center text-sm text-foreground/50">Loading word game…</p>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Word Game</h1>
        <p className="text-sm text-foreground/60">Pronounce the word before time runs out to earn.</p>
      </div>

      {planRequired && (
        <Card className="flex items-center gap-3 border border-brand-amber/30 bg-brand-amber/10 p-4">
          <Crown className="h-5 w-5 flex-none text-brand-amber" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Activate a plan to play Word Game</p>
            <p className="text-xs text-foreground/60">Word Game is only available to members with an active plan.</p>
          </div>
          <Link href="/plans" className="flex-none rounded-lg bg-brand-amber px-3 py-1.5 text-xs font-bold text-[#3a2c00]">
            View plans
          </Link>
        </Card>
      )}

      {tasks.length === 0 && (
        <p className="py-10 text-center text-sm text-foreground/50">No words available right now.</p>
      )}

      {tasks.map((task) => {
        const exhausted = task.completedToday >= task.dailyLimit;
        return (
          <Card key={task.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-brand-green/15 p-2.5 text-brand-green">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold">{task.title}</p>
                  <p className="text-xs text-foreground/50">
                    {task.completedToday}/{task.dailyLimit} today · {Math.min(task.maxDuration, 10)}s to say it
                  </p>
                </div>
              </div>
              <span className="whitespace-nowrap text-sm font-bold text-brand-green">
                {formatCurrency(task.rewardAmount)}
              </span>
            </div>

            {exhausted ? (
              <p className="mt-3 rounded-xl bg-surface-muted py-2 text-center text-xs text-foreground/50">
                Daily limit reached — come back tomorrow
              </p>
            ) : activeTaskId === task.id ? (
              <div className="mt-3">
                <WordGameRecorder task={task} onDone={() => { setActiveTaskId(null); load(); }} />
              </div>
            ) : (
              <button
                onClick={() => setActiveTaskId(task.id)}
                disabled={planRequired}
                className={cn(
                  "mt-3 w-full rounded-xl gradient-brand py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                )}
              >
                Start
              </button>
            )}
          </Card>
        );
      })}
    </div>
  );
}

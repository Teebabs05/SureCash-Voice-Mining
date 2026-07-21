"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { BookOpen, Crown, PartyPopper } from "lucide-react";
import { Card } from "@/components/ui/card";
import { WordGameRecorder } from "@/components/word-game/recorder";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

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

function pickRandom(list: WordGameTask[], excludeId: string | null): WordGameTask | null {
  const candidates = list.length > 1 ? list.filter((t) => t.id !== excludeId) : list;
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export default function WordGamePage() {
  const [tasks, setTasks] = useState<WordGameTask[]>([]);
  const [planRequired, setPlanRequired] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const lastIdRef = useRef<string | null>(null);

  const load = useCallback(() => {
    return apiFetch<{ tasks: WordGameTask[]; planRequired: boolean }>("/api/voice/tasks?category=word_game").then(
      (res) => {
        setTasks(res.tasks);
        setPlanRequired(res.planRequired);
      }
    );
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const pool = tasks.filter((t) => t.completedToday < t.dailyLimit);

  useEffect(() => {
    if (currentId && pool.some((t) => t.id === currentId)) return;
    const next = pickRandom(pool, lastIdRef.current);
    lastIdRef.current = next?.id ?? null;
    setCurrentId(next?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the pool composition or the active word actually changes
  }, [currentId, pool.map((t) => t.id).join(",")]);

  function skip() {
    lastIdRef.current = currentId;
    const next = pickRandom(pool, currentId);
    setCurrentId(next?.id ?? null);
  }

  const current = tasks.find((t) => t.id === currentId) ?? null;
  const totalRemaining = pool.reduce((sum, t) => sum + Math.max(t.dailyLimit - t.completedToday, 0), 0);

  if (loading) return <p className="py-10 text-center text-sm text-foreground/50">Loading word game…</p>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Word Game</h1>
        <p className="text-sm text-foreground/60">
          Pronounce a simple word correctly to win your reward. No timer, no pressure - just say it right.
        </p>
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

      {!planRequired && !current && (
        <Card className="flex flex-col items-center gap-2 py-10 text-center">
          <PartyPopper className="h-8 w-8 text-brand-green" />
          <p className="font-semibold">
            {tasks.length === 0 ? "No words available right now." : "You've done every word for today!"}
          </p>
          <p className="text-xs text-foreground/50">Come back tomorrow for more.</p>
        </Card>
      )}

      {!planRequired && current && (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-brand-green/15 p-2.5 text-brand-green">
                <BookOpen className="h-4 w-4" />
              </div>
              <p className="text-xs text-foreground/50">{totalRemaining} word{totalRemaining === 1 ? "" : "s"} left today</p>
            </div>
            <span className="whitespace-nowrap text-sm font-bold text-brand-green">
              {formatCurrency(current.rewardAmount)}
            </span>
          </div>

          <div className="mt-3">
            <WordGameRecorder
              key={current.id}
              task={current}
              onSkip={skip}
              onDone={() => {
                lastIdRef.current = current.id;
                load().then(() => setCurrentId(null));
              }}
            />
          </div>
        </Card>
      )}
    </div>
  );
}

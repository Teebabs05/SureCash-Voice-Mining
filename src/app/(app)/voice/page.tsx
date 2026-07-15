"use client";

import { useEffect, useState, useCallback } from "react";
import { Mic } from "lucide-react";
import { Card } from "@/components/ui/card";
import { VoiceRecorder } from "@/components/voice/recorder";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, cn } from "@/lib/utils";

interface VoiceTask {
  id: string;
  title: string;
  promptText: string;
  language: string;
  rewardAmount: string;
  dailyLimit: number;
  minDuration: number;
  maxDuration: number;
  completedToday: number;
}

export default function VoicePage() {
  const [tasks, setTasks] = useState<VoiceTask[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    apiFetch<{ tasks: VoiceTask[] }>("/api/voice/tasks")
      .then((res) => setTasks(res.tasks))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="py-10 text-center text-sm text-foreground/50">Loading voice tasks…</p>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Voice Tasks</h1>
        <p className="text-sm text-foreground/60">Record short voice samples to earn instantly.</p>
      </div>

      {tasks.length === 0 && (
        <p className="py-10 text-center text-sm text-foreground/50">No voice tasks available right now.</p>
      )}

      {tasks.map((task) => {
        const exhausted = task.completedToday >= task.dailyLimit;
        return (
          <Card key={task.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="rounded-full gradient-wallet-voice p-2.5 text-white">
                  <Mic className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold">{task.title}</p>
                  <p className="text-xs text-foreground/50">
                    {task.completedToday}/{task.dailyLimit} today · {task.minDuration}-{task.maxDuration}s
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
                <VoiceRecorder task={task} onDone={() => { setActiveTaskId(null); load(); }} />
              </div>
            ) : (
              <button
                onClick={() => setActiveTaskId(task.id)}
                className={cn(
                  "mt-3 w-full rounded-xl gradient-brand py-2.5 text-sm font-semibold text-white"
                )}
              >
                Start recording
              </button>
            )}
          </Card>
        );
      })}
    </div>
  );
}

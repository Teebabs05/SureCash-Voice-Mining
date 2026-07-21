"use client";

import { useEffect, useState, useCallback } from "react";
import { Mic } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PlanGateBanner } from "@/components/plan-gate-banner";
import { PlanLockScreen } from "@/components/plan-lock-screen";
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
  const [planRequired, setPlanRequired] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [sectionDailyLimit, setSectionDailyLimit] = useState<number | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    apiFetch<{
      tasks: VoiceTask[];
      planRequired: boolean;
      sectionDailyLimit: number | null;
      sectionCompletedToday: number;
    }>("/api/voice/tasks?category=session")
      .then((res) => {
        setTasks(res.tasks);
        setPlanRequired(res.planRequired);
        setSectionDailyLimit(res.sectionDailyLimit);
        setLimitReached(res.sectionDailyLimit !== null && res.sectionCompletedToday >= res.sectionDailyLimit);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="py-10 text-center text-sm text-foreground/50">Loading voice tasks…</p>;

  if (planRequired) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">Voice Earn</h1>
        <PlanLockScreen
          icon={Mic}
          title="Voice Earn"
          description="Read short, simple sentences out loud and get paid for each completed session. Activate a plan to start earning with your voice."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Voice Tasks</h1>
        <p className="text-sm text-foreground/60">Record short voice samples to earn instantly.</p>
      </div>

      {limitReached && (
        <PlanGateBanner reason="limit_reached" feature="submit voice tasks" dailyLimit={sectionDailyLimit ?? undefined} />
      )}

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
                disabled={limitReached}
                className={cn(
                  "mt-3 w-full rounded-xl gradient-brand py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ArrowLeft, ChevronRight, Mic, PartyPopper } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PlanGateBanner } from "@/components/plan-gate-banner";
import { PlanLockScreen } from "@/components/plan-lock-screen";
import { VoiceRecorder } from "@/components/voice/recorder";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

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

interface LanguageSummary {
  code: string;
  label: string;
  sectionDailyLimit: number | null;
  completedToday: number;
  limitReached: boolean;
}

function pickRandom(list: VoiceTask[], excludeId: string | null): VoiceTask | null {
  const candidates = list.length > 1 ? list.filter((t) => t.id !== excludeId) : list;
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export default function VoicePage() {
  const [planRequired, setPlanRequired] = useState(false);
  const [languages, setLanguages] = useState<LanguageSummary[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [tasks, setTasks] = useState<VoiceTask[]>([]);
  const [limitReached, setLimitReached] = useState(false);
  const [sectionDailyLimit, setSectionDailyLimit] = useState<number | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const lastIdRef = useRef<string | null>(null);

  const loadLanguages = useCallback(() => {
    return apiFetch<{ planRequired: boolean; languages: LanguageSummary[] }>("/api/voice/tasks?category=session").then(
      (res) => {
        setPlanRequired(res.planRequired);
        setLanguages(res.languages);
      }
    );
  }, []);

  useEffect(() => {
    loadLanguages().finally(() => setLoading(false));
  }, [loadLanguages]);

  const loadTasks = useCallback(() => {
    if (!selectedLanguage) return Promise.resolve();
    return apiFetch<{
      tasks: VoiceTask[];
      sectionDailyLimit: number | null;
      sectionCompletedToday: number;
    }>(`/api/voice/tasks?category=session&language=${selectedLanguage}`).then((res) => {
      setTasks(res.tasks);
      setSectionDailyLimit(res.sectionDailyLimit);
      setLimitReached(res.sectionDailyLimit !== null && res.sectionCompletedToday >= res.sectionDailyLimit);
    });
  }, [selectedLanguage]);

  useEffect(() => {
    if (selectedLanguage) loadTasks();
  }, [selectedLanguage, loadTasks]);

  const pool = tasks.filter((t) => t.completedToday < t.dailyLimit);

  useEffect(() => {
    if (!selectedLanguage) return;
    if (currentId && pool.some((t) => t.id === currentId)) return;
    const next = pickRandom(pool, lastIdRef.current);
    lastIdRef.current = next?.id ?? null;
    setCurrentId(next?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the pool composition or the active task actually changes
  }, [selectedLanguage, currentId, pool.map((t) => t.id).join(",")]);

  function skip() {
    lastIdRef.current = currentId;
    const next = pickRandom(pool, currentId);
    setCurrentId(next?.id ?? null);
  }

  function backToLanguages() {
    setSelectedLanguage(null);
    setCurrentId(null);
    setTasks([]);
    lastIdRef.current = null;
    loadLanguages();
  }

  const current = tasks.find((t) => t.id === currentId) ?? null;
  const totalRemaining = pool.reduce((sum, t) => sum + Math.max(t.dailyLimit - t.completedToday, 0), 0);
  const currentLanguageLabel = languages.find((l) => l.code === selectedLanguage)?.label ?? selectedLanguage;

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

  if (!selectedLanguage) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-bold">Voice Tasks</h1>
          <p className="text-sm text-foreground/60">Record short voice samples to earn instantly.</p>
        </div>

        <div className="flex flex-col gap-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLanguage(lang.code)}
              className="card flex items-center justify-between gap-3 p-5 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-brand-primary/15 p-2.5 text-brand-primary">
                  <Mic className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold">{lang.label}</p>
                  <p className="text-xs text-foreground/50">
                    {lang.sectionDailyLimit !== null
                      ? `${lang.completedToday}/${lang.sectionDailyLimit} today`
                      : "No daily cap"}
                  </p>
                </div>
              </div>
              {lang.limitReached ? (
                <span className="whitespace-nowrap rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-foreground/50">
                  Done for today
                </span>
              ) : (
                <ChevronRight className="h-4 w-4 text-foreground/30" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button onClick={backToLanguages} className="flex items-center gap-1 text-sm text-foreground/60">
        <ArrowLeft className="h-4 w-4" /> Languages
      </button>
      <div>
        <h1 className="text-xl font-bold">{currentLanguageLabel}</h1>
        <p className="text-sm text-foreground/60">Record short voice samples to earn instantly.</p>
      </div>

      {limitReached && (
        <PlanGateBanner reason="limit_reached" feature="submit voice tasks" dailyLimit={sectionDailyLimit ?? undefined} />
      )}

      {!limitReached && !current && (
        <Card className="flex flex-col items-center gap-2 py-10 text-center">
          <PartyPopper className="h-8 w-8 text-brand-green" />
          <p className="font-semibold">
            {tasks.length === 0 ? "No voice tasks available right now." : "You've done every sentence for today!"}
          </p>
          <p className="text-xs text-foreground/50">Come back tomorrow for more.</p>
        </Card>
      )}

      {!limitReached && current && (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-brand-primary/15 p-2.5 text-brand-primary">
                <Mic className="h-4 w-4" />
              </div>
              <p className="text-xs text-foreground/50">
                {totalRemaining} session{totalRemaining === 1 ? "" : "s"} left today
              </p>
            </div>
            <span className="whitespace-nowrap text-sm font-bold text-brand-green">
              {formatCurrency(current.rewardAmount)}
            </span>
          </div>

          <div className="mt-3">
            <VoiceRecorder
              key={current.id}
              task={current}
              canSkip={pool.length > 1}
              onSkip={skip}
              onDone={() => {
                lastIdRef.current = current.id;
                loadTasks().then(() => setCurrentId(null));
              }}
            />
          </div>
        </Card>
      )}
    </div>
  );
}

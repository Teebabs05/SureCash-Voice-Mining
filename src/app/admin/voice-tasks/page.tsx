"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Check, X, Trash2, Pencil } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency, cn } from "@/lib/utils";

interface VoiceTask {
  id: string;
  title: string;
  promptText: string;
  category: string;
  rewardAmount: string;
  dailyLimit: number;
  minDuration: number;
  maxDuration: number;
  isActive: boolean;
}

interface FlaggedRecording {
  id: string;
  audioUrl: string;
  createdAt: string;
  user: { fullName: string; email: string };
  voiceTask: { title: string; rewardAmount: string };
  aiResult: {
    transcript: string | null;
    confidence: number;
    isDuplicate: boolean;
    isReplayAttack: boolean;
    hasBackgroundNoise: boolean;
    isSynthesizedVoice: boolean;
  } | null;
}

export default function AdminVoiceTasksPage() {
  const [tasks, setTasks] = useState<VoiceTask[]>([]);
  const [flagged, setFlagged] = useState<FlaggedRecording[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    promptText: "",
    category: "session",
    rewardAmount: "",
    dailyLimit: "5",
    minDuration: "3",
    maxDuration: "30",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    promptText: "",
    category: "session",
    rewardAmount: "",
    dailyLimit: "",
    minDuration: "",
    maxDuration: "",
  });

  const loadTasks = useCallback(() => {
    apiFetch<{ tasks: VoiceTask[] }>("/api/admin/voice-tasks").then((res) => setTasks(res.tasks));
  }, []);
  const loadFlagged = useCallback(() => {
    apiFetch<{ recordings: FlaggedRecording[] }>("/api/admin/voice-recordings?status=FLAGGED").then((res) =>
      setFlagged(res.recordings)
    );
  }, []);

  useEffect(() => {
    loadTasks();
    loadFlagged();
  }, [loadTasks, loadFlagged]);

  async function createTask() {
    try {
      await apiFetch("/api/admin/voice-tasks", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          promptText: form.promptText,
          category: form.category,
          rewardAmount: Number(form.rewardAmount),
          dailyLimit: Number(form.dailyLimit),
          minDuration: Number(form.minDuration),
          maxDuration: Number(form.maxDuration),
        }),
      });
      toast.success("Voice task created");
      setForm({
        title: "",
        promptText: "",
        category: "session",
        rewardAmount: "",
        dailyLimit: "5",
        minDuration: "3",
        maxDuration: "30",
      });
      setShowForm(false);
      loadTasks();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create task");
    }
  }

  function startEdit(task: VoiceTask) {
    setEditingId(task.id);
    setEditForm({
      title: task.title,
      promptText: task.promptText,
      category: task.category,
      rewardAmount: task.rewardAmount,
      dailyLimit: String(task.dailyLimit),
      minDuration: String(task.minDuration),
      maxDuration: String(task.maxDuration),
    });
  }

  async function saveEdit(id: string) {
    setBusyId(id);
    try {
      await apiFetch(`/api/admin/voice-tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: editForm.title,
          promptText: editForm.promptText,
          category: editForm.category,
          rewardAmount: Number(editForm.rewardAmount),
          dailyLimit: Number(editForm.dailyLimit),
          minDuration: Number(editForm.minDuration),
          maxDuration: Number(editForm.maxDuration),
        }),
      });
      toast.success("Voice task updated");
      setEditingId(null);
      loadTasks();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update task");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(task: VoiceTask) {
    setBusyId(task.id);
    try {
      await apiFetch(`/api/admin/voice-tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !task.isActive }),
      });
      loadTasks();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteTask(task: VoiceTask) {
    setBusyId(task.id);
    try {
      const res = await apiFetch<{ hardDeleted: boolean; message?: string }>(`/api/admin/voice-tasks/${task.id}`, {
        method: "DELETE",
      });
      toast.success(res.hardDeleted ? "Task deleted" : res.message ?? "Task deactivated");
      loadTasks();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function resolveRecording(id: string, action: "approve" | "reject") {
    setBusyId(id);
    try {
      await apiFetch(`/api/admin/voice-recordings/${id}/resolve`, { method: "POST", body: JSON.stringify({ action }) });
      toast.success(`Recording ${action}d`);
      loadFlagged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Voice Tasks</h1>

      <Card>
        <CardHeader>
          <CardTitle>Task templates</CardTitle>
        </CardHeader>
        <div className="flex flex-col gap-2">
          {tasks.map((t) =>
            editingId === t.id ? (
              <div key={t.id} className="flex flex-col gap-2 rounded-xl bg-surface-muted p-3">
                <Input
                  placeholder="Title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
                <Input
                  placeholder="Prompt text to read aloud"
                  value={editForm.promptText}
                  onChange={(e) => setEditForm({ ...editForm, promptText: e.target.value })}
                />
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                >
                  <option value="session">Voice Earn session</option>
                  <option value="word_game">Word Game</option>
                </select>
                <div className="flex gap-2">
                  <Input
                    placeholder="Reward amount"
                    type="number"
                    value={editForm.rewardAmount}
                    onChange={(e) => setEditForm({ ...editForm, rewardAmount: e.target.value })}
                  />
                  <Input
                    placeholder="Daily limit"
                    type="number"
                    value={editForm.dailyLimit}
                    onChange={(e) => setEditForm({ ...editForm, dailyLimit: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    label="Min seconds"
                    type="number"
                    value={editForm.minDuration}
                    onChange={(e) => setEditForm({ ...editForm, minDuration: e.target.value })}
                  />
                  <Input
                    label="Max seconds"
                    type="number"
                    value={editForm.maxDuration}
                    onChange={(e) => setEditForm({ ...editForm, maxDuration: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" loading={busyId === t.id} onClick={() => saveEdit(t.id)}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div key={t.id} className="flex items-center justify-between rounded-xl bg-surface-muted p-3">
                <div>
                  <p className="text-sm font-semibold">
                    {t.title} {t.category === "word_game" && <span className="text-xs text-brand-primary">(Word Game)</span>}
                  </p>
                  <p className="text-xs text-foreground/50">{t.promptText}</p>
                  <p className="text-xs font-medium text-brand-green">
                    {formatCurrency(t.rewardAmount)} · {t.dailyLimit}/day · {t.minDuration}-{t.maxDuration}s
                  </p>
                </div>
                <div className="flex flex-none gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(t)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant={t.isActive ? "outline" : "primary"}
                    loading={busyId === t.id}
                    onClick={() => toggleActive(t)}
                  >
                    {t.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="danger" loading={busyId === t.id} onClick={() => deleteTask(t)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          )}
        </div>

        {showForm ? (
          <div className="mt-3 flex flex-col gap-2">
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input
              placeholder="Prompt text to read aloud"
              value={form.promptText}
              onChange={(e) => setForm({ ...form, promptText: e.target.value })}
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            >
              <option value="session">Voice Earn session</option>
              <option value="word_game">Word Game</option>
            </select>
            <div className="flex gap-2">
              <Input
                placeholder="Reward amount"
                type="number"
                value={form.rewardAmount}
                onChange={(e) => setForm({ ...form, rewardAmount: e.target.value })}
              />
              <Input
                placeholder="Daily limit"
                type="number"
                value={form.dailyLimit}
                onChange={(e) => setForm({ ...form, dailyLimit: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Input
                label="Min seconds"
                type="number"
                value={form.minDuration}
                onChange={(e) => setForm({ ...form, minDuration: e.target.value })}
              />
              <Input
                label="Max seconds"
                type="number"
                value={form.maxDuration}
                onChange={(e) => setForm({ ...form, maxDuration: e.target.value })}
              />
            </div>
            <p className="text-xs text-foreground/50">
              Word Game is untimed for the user - min/max seconds are only used to reject recordings that are
              suspiciously short or long.
            </p>
            <Button onClick={createTask}>Create task</Button>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-border py-2.5 text-sm text-brand-primary"
          >
            <Plus className="h-4 w-4" /> New voice task
          </button>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flagged recordings ({flagged.length})</CardTitle>
        </CardHeader>
        <div className="flex flex-col gap-3">
          {flagged.length === 0 && <p className="text-sm text-foreground/50">Nothing flagged right now</p>}
          {flagged.map((r) => (
            <div key={r.id} className="rounded-xl bg-surface-muted p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{r.user.fullName}</p>
                  <p className="text-xs text-foreground/50">{r.voiceTask.title}</p>
                </div>
                <div className="flex gap-1">
                  {r.aiResult?.isDuplicate && <Badge label="Duplicate" />}
                  {r.aiResult?.isReplayAttack && <Badge label="Replay" />}
                  {r.aiResult?.hasBackgroundNoise && <Badge label="Noise" />}
                  {r.aiResult?.isSynthesizedVoice && <Badge label="Synthetic" />}
                </div>
              </div>
              <RecordingAudio src={r.audioUrl} />
              <div className="mt-2 flex gap-2">
                <Button size="sm" loading={busyId === r.id} onClick={() => resolveRecording(r.id, "approve")}>
                  <Check className="h-3.5 w-3.5" /> Approve & pay
                </Button>
                <Button size="sm" variant="danger" loading={busyId === r.id} onClick={() => resolveRecording(r.id, "reject")}>
                  <X className="h-3.5 w-3.5" /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return <span className={cn("rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-500")}>{label}</span>;
}

function RecordingAudio({ src }: { src: string }) {
  const [unavailable, setUnavailable] = useState(false);

  if (unavailable) {
    return <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-xs text-foreground/50">Recording unavailable</p>;
  }

  return <audio controls src={src} className="mt-2 w-full" onError={() => setUnavailable(true)} />;
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Check, X, Pencil, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

interface TaskCenterTask {
  id: string;
  title: string;
  description: string;
  type: string;
  actionUrl: string | null;
  rewardAmount: string;
  isActive: boolean;
  requiresProof: boolean;
}

interface PendingCompletion {
  id: string;
  proofUrl: string | null;
  proofText: string | null;
  proofImageUrl: string | null;
  createdAt: string;
  user: { fullName: string; email: string };
  task: { title: string; rewardAmount: string };
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<TaskCenterTask[]>([]);
  const [pending, setPending] = useState<PendingCompletion[]>([]);
  const [autoRejected, setAutoRejected] = useState<PendingCompletion[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "social",
    actionUrl: "",
    rewardAmount: "",
    requiresProof: false,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    type: "social",
    actionUrl: "",
    rewardAmount: "",
    requiresProof: false,
  });

  const loadTasks = useCallback(() => {
    apiFetch<{ tasks: TaskCenterTask[] }>("/api/admin/tasks").then((res) => setTasks(res.tasks));
  }, []);
  const loadPending = useCallback(() => {
    apiFetch<{ completions: PendingCompletion[] }>("/api/admin/task-completions").then((res) => setPending(res.completions));
  }, []);
  const loadAutoRejected = useCallback(() => {
    apiFetch<{ completions: PendingCompletion[] }>("/api/admin/task-completions?status=auto_rejected").then((res) =>
      setAutoRejected(res.completions)
    );
  }, []);

  useEffect(() => {
    loadTasks();
    loadPending();
    loadAutoRejected();
  }, [loadTasks, loadPending, loadAutoRejected]);

  async function createTask() {
    try {
      await apiFetch("/api/admin/tasks", {
        method: "POST",
        body: JSON.stringify({ ...form, rewardAmount: Number(form.rewardAmount) }),
      });
      toast.success("Task created");
      setForm({ title: "", description: "", type: "social", actionUrl: "", rewardAmount: "", requiresProof: false });
      setShowForm(false);
      loadTasks();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create task");
    }
  }

  function startEdit(task: TaskCenterTask) {
    setEditingId(task.id);
    setEditForm({
      title: task.title,
      description: task.description,
      type: task.type,
      actionUrl: task.actionUrl ?? "",
      rewardAmount: task.rewardAmount,
      requiresProof: task.requiresProof,
    });
  }

  async function saveEdit(id: string) {
    setBusyId(id);
    try {
      await apiFetch(`/api/admin/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...editForm, rewardAmount: Number(editForm.rewardAmount) }),
      });
      toast.success("Task updated");
      setEditingId(null);
      loadTasks();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update task");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteTask(task: TaskCenterTask) {
    if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    setBusyId(task.id);
    try {
      const res = await apiFetch<{ hardDeleted: boolean; message?: string }>(`/api/admin/tasks/${task.id}`, {
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

  async function toggleActive(task: TaskCenterTask) {
    setBusyId(task.id);
    try {
      await apiFetch(`/api/admin/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !task.isActive }) });
      loadTasks();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function resolveCompletion(id: string, action: "approve" | "reject") {
    setBusyId(id);
    try {
      await apiFetch(`/api/admin/task-completions/${id}/resolve`, { method: "POST", body: JSON.stringify({ action }) });
      toast.success(`Submission ${action}d`);
      loadPending();
      loadAutoRejected();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Task Center</h1>

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
                  placeholder="Description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                  className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                >
                  <option value="social">General task</option>
                  <option value="sponsored_post">Sponsored Post (share on social media)</option>
                </select>
                <Input
                  placeholder="Action URL (optional)"
                  value={editForm.actionUrl}
                  onChange={(e) => setEditForm({ ...editForm, actionUrl: e.target.value })}
                />
                <Input
                  placeholder="Reward amount"
                  type="number"
                  value={editForm.rewardAmount}
                  onChange={(e) => setEditForm({ ...editForm, rewardAmount: e.target.value })}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.requiresProof}
                    onChange={(e) => setEditForm({ ...editForm, requiresProof: e.target.checked })}
                  />
                  Requires manual proof review
                </label>
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
                    {t.title} {t.type === "sponsored_post" && <span className="text-xs text-brand-primary">(Sponsored Post)</span>}
                    {t.requiresProof && <span className="text-xs text-brand-primary"> (needs proof)</span>}
                  </p>
                  <p className="text-xs text-foreground/50">{t.description}</p>
                  <p className="text-xs font-medium text-brand-green">{formatCurrency(t.rewardAmount)}</p>
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
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            >
              <option value="social">General task</option>
              <option value="sponsored_post">Sponsored Post (share on social media)</option>
            </select>
            <Input
              placeholder="Action URL (optional)"
              value={form.actionUrl}
              onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
            />
            <Input
              placeholder="Reward amount"
              type="number"
              value={form.rewardAmount}
              onChange={(e) => setForm({ ...form, rewardAmount: e.target.value })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.requiresProof}
                onChange={(e) => setForm({ ...form, requiresProof: e.target.checked })}
              />
              Requires manual proof review
            </label>
            <Button onClick={createTask}>Create task</Button>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-border py-2.5 text-sm text-brand-primary"
          >
            <Plus className="h-4 w-4" /> New task
          </button>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending proof review ({pending.length})</CardTitle>
        </CardHeader>
        <div className="flex flex-col gap-3">
          {pending.length === 0 && <p className="text-sm text-foreground/50">Nothing pending</p>}
          {pending.map((c) => (
            <div key={c.id} className="rounded-xl bg-surface-muted p-3">
              <p className="text-sm font-semibold">{c.user.fullName}</p>
              <p className="text-xs text-foreground/50">{c.task.title} · {formatCurrency(c.task.rewardAmount)}</p>
              {c.proofUrl && (
                <a href={c.proofUrl} target="_blank" className="text-xs text-brand-primary underline">
                  {c.proofUrl}
                </a>
              )}
              {c.proofText && <p className="mt-1 text-xs text-foreground/70">&ldquo;{c.proofText}&rdquo;</p>}
              <div className="mt-2 flex gap-2">
                <Button size="sm" loading={busyId === c.id} onClick={() => resolveCompletion(c.id, "approve")}>
                  <Check className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button size="sm" variant="danger" loading={busyId === c.id} onClick={() => resolveCompletion(c.id, "reject")}>
                  <X className="h-3.5 w-3.5" /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auto-rejected duplicates ({autoRejected.length})</CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-foreground/50">
          The system auto-rejects a screenshot that matches a prior submission - this is the override path if one
          turns out to be a false positive (e.g. two people genuinely submitted similar stock screenshots).
        </p>
        <div className="flex flex-col gap-3">
          {autoRejected.length === 0 && <p className="text-sm text-foreground/50">Nothing auto-rejected right now</p>}
          {autoRejected.map((c) => (
            <div key={c.id} className="rounded-xl bg-surface-muted p-3">
              <p className="text-sm font-semibold">{c.user.fullName}</p>
              <p className="text-xs text-foreground/50">{c.task.title} · {formatCurrency(c.task.rewardAmount)}</p>
              {c.proofImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.proofImageUrl} alt="Submitted proof" className="mt-2 max-h-48 rounded-lg object-contain" />
              )}
              <div className="mt-2">
                <Button size="sm" loading={busyId === c.id} onClick={() => resolveCompletion(c.id, "approve")}>
                  <Check className="h-3.5 w-3.5" /> Approve anyway
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

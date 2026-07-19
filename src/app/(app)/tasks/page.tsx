"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ClipboardCheck, CheckCircle2, ExternalLink, Clock, Upload, Crown } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

interface TaskCenterTask {
  id: string;
  title: string;
  description: string;
  type: string;
  actionUrl: string | null;
  rewardAmount: string;
  isRepeatable: boolean;
  requiresProof: boolean;
  isCompleted: boolean;
  isPending: boolean;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskCenterTask[]>([]);
  const [planRequired, setPlanRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [proofTaskId, setProofTaskId] = useState<string | null>(null);
  const [proof, setProof] = useState({ proofUrl: "", proofText: "" });
  const [proofImage, setProofImage] = useState<File | null>(null);

  const load = useCallback(() => {
    apiFetch<{ tasks: TaskCenterTask[]; planRequired: boolean }>("/api/tasks")
      .then((res) => {
        setTasks(res.tasks);
        setPlanRequired(res.planRequired);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function complete(task: TaskCenterTask) {
    if (task.requiresProof) {
      setProofTaskId(task.id);
      if (task.actionUrl) window.open(task.actionUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setCompletingId(task.id);
    try {
      if (task.actionUrl) window.open(task.actionUrl, "_blank", "noopener,noreferrer");
      const form = new FormData();
      form.append("taskId", task.id);
      const res = await apiFetch<{ reward: number }>("/api/tasks/complete", {
        method: "POST",
        body: form,
        headers: {},
      });
      toast.success(`+${formatCurrency(res.reward)} added to your Task wallet`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not complete task");
    } finally {
      setCompletingId(null);
    }
  }

  async function submitProof(task: TaskCenterTask) {
    setCompletingId(task.id);
    try {
      const form = new FormData();
      form.append("taskId", task.id);
      if (proof.proofUrl) form.append("proofUrl", proof.proofUrl);
      if (proof.proofText) form.append("proofText", proof.proofText);
      if (proofImage) form.append("proofImage", proofImage);

      const res = await apiFetch<{ pending: boolean; reward?: number }>("/api/tasks/complete", {
        method: "POST",
        body: form,
        headers: {},
      });
      toast.success(
        res.pending ? "Submitted for admin review" : `Approved! +${formatCurrency(res.reward ?? 0)} added to your Task wallet`
      );
      setProofTaskId(null);
      setProof({ proofUrl: "", proofText: "" });
      setProofImage(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not submit proof");
    } finally {
      setCompletingId(null);
    }
  }

  if (loading) return <p className="py-10 text-center text-sm text-foreground/50">Loading tasks…</p>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Task Center</h1>
        <p className="text-sm text-foreground/60">Complete simple tasks for extra rewards.</p>
      </div>

      {planRequired && (
        <Card className="flex items-center gap-3 border border-brand-amber/30 bg-brand-amber/10 p-4">
          <Crown className="h-5 w-5 flex-none text-brand-amber" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Activate a plan to complete tasks</p>
            <p className="text-xs text-foreground/60">Task Center is only available to members with an active plan.</p>
          </div>
          <Link href="/plans" className="flex-none rounded-lg bg-brand-amber px-3 py-1.5 text-xs font-bold text-[#3a2c00]">
            View plans
          </Link>
        </Card>
      )}

      {tasks.length === 0 && (
        <p className="py-10 text-center text-sm text-foreground/50">No tasks available right now.</p>
      )}

      {tasks.map((task) => (
        <Card key={task.id}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-full gradient-wallet-task p-2.5 text-white">
                <ClipboardCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold">{task.title}</p>
                <p className="text-xs text-foreground/50">{task.description}</p>
                <p className="mt-0.5 text-xs font-semibold text-brand-green">{formatCurrency(task.rewardAmount)}</p>
              </div>
            </div>

            {task.isPending ? (
              <span className="flex items-center gap-1 text-xs font-medium text-brand-amber">
                <Clock className="h-4 w-4" /> Review
              </span>
            ) : task.isCompleted ? (
              <span className="flex items-center gap-1 text-xs font-medium text-brand-green">
                <CheckCircle2 className="h-4 w-4" /> Done
              </span>
            ) : (
              <Button size="sm" disabled={planRequired} loading={completingId === task.id} onClick={() => complete(task)}>
                {task.actionUrl && <ExternalLink className="h-3.5 w-3.5" />}
                Go
              </Button>
            )}
          </div>

          {proofTaskId === task.id && (
            <div className="mt-3 flex flex-col gap-2 rounded-xl bg-surface-muted p-3">
              <p className="text-xs text-foreground/60">
                Upload a screenshot for instant approval, or paste a link/description for admin review.
              </p>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-4 text-sm text-foreground/60">
                <Upload className="h-4 w-4" />
                {proofImage ? proofImage.name : "Upload screenshot"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setProofImage(e.target.files?.[0] ?? null)}
                />
              </label>
              <Input
                placeholder="Proof link (optional)"
                value={proof.proofUrl}
                onChange={(e) => setProof({ ...proof, proofUrl: e.target.value })}
              />
              <Input
                placeholder="Describe your submission"
                value={proof.proofText}
                onChange={(e) => setProof({ ...proof, proofText: e.target.value })}
              />
              <Button size="sm" loading={completingId === task.id} onClick={() => submitProof(task)}>
                Submit
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

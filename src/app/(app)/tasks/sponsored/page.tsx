"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Camera, CheckCircle2, ExternalLink, Clock, Share2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

interface SponsoredTask {
  id: string;
  title: string;
  description: string;
  actionUrl: string | null;
  rewardAmount: string;
  isRepeatable: boolean;
  requiresProof: boolean;
  isCompleted: boolean;
  isPending: boolean;
}

interface SocialAccounts {
  facebookUrl: string | null;
  instagramHandle: string | null;
  tiktokHandle: string | null;
}

export default function SponsoredPostsPage() {
  const [tasks, setTasks] = useState<SponsoredTask[]>([]);
  const [linkedCount, setLinkedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [proofTaskId, setProofTaskId] = useState<string | null>(null);
  const [proof, setProof] = useState({ proofUrl: "", proofText: "" });
  const [proofImage, setProofImage] = useState<File | null>(null);

  const load = useCallback(() => {
    apiFetch<{ tasks: SponsoredTask[] }>("/api/tasks?category=sponsored").then((res) => setTasks(res.tasks));
    apiFetch<{ socialAccounts: SocialAccounts }>("/api/profile/social-accounts")
      .then((res) => {
        const { facebookUrl, instagramHandle, tiktokHandle } = res.socialAccounts;
        setLinkedCount([facebookUrl, instagramHandle, tiktokHandle].filter(Boolean).length);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const canSubmit = linkedCount >= 2;

  async function submitProof(task: SponsoredTask) {
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

  function startProof(task: SponsoredTask) {
    if (!canSubmit) {
      toast.error("Link at least 2 social accounts first");
      return;
    }
    setProofTaskId(task.id);
    if (task.actionUrl) window.open(task.actionUrl, "_blank", "noopener,noreferrer");
  }

  if (loading) return <p className="py-10 text-center text-sm text-foreground/50">Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Sponsored Posts</h1>
        <p className="text-sm text-foreground/60">Share posts on your social accounts to earn.</p>
      </div>

      {!canSubmit && (
        <Link href="/profile/social-accounts">
          <Card className="flex items-center justify-between gradient-brand text-white">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Share2 className="h-4 w-4" /> Link at least 2 social accounts to start earning
            </span>
            <ExternalLink className="h-4 w-4" />
          </Card>
        </Link>
      )}

      {tasks.length === 0 && (
        <p className="py-10 text-center text-sm text-foreground/50">No sponsored posts available right now.</p>
      )}

      {tasks.map((task) => (
        <Card key={task.id}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-500/15 p-2.5 text-red-500">
                <Camera className="h-4 w-4" />
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
              <Button size="sm" loading={completingId === task.id} onClick={() => startProof(task)}>
                {task.actionUrl && <ExternalLink className="h-3.5 w-3.5" />}
                Go
              </Button>
            )}
          </div>

          {proofTaskId === task.id && (
            <div className="mt-3 flex flex-col gap-2 rounded-xl bg-surface-muted p-3">
              <p className="text-xs text-foreground/60">
                Upload a screenshot of your post for instant approval, or paste a link/description for admin review.
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
                placeholder="Post link (optional)"
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

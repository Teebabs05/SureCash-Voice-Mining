"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Link as LinkIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";

interface Submission {
  id: string;
  proofUrl: string | null;
  proofText: string | null;
  rewardPaid: string;
  createdAt: string;
  user: { id: string; fullName: string; email: string };
  task: { id: string; title: string; type: string };
}

export default function AdminTaskSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    apiFetch<{ submissions: Submission[] }>("/api/admin/task-submissions")
      .then((res) => setSubmissions(res.submissions))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(s: Submission) {
    setBusyId(s.id);
    try {
      await apiFetch(`/api/admin/task-submissions/${s.id}/approve`, { method: "POST" });
      toast.success(`Approved — ${s.rewardPaid} credited to ${s.user.fullName}`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not approve");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(s: Submission) {
    const note = prompt("Reason for rejection (shown to the user):") ?? undefined;
    setBusyId(s.id);
    try {
      await apiFetch(`/api/admin/task-submissions/${s.id}/reject`, { method: "POST", body: JSON.stringify({ note }) });
      toast.success(`${s.user.fullName}'s submission rejected`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not reject");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Task Proof Review</h1>
        <p className="text-sm text-foreground/50">
          Submissions with a link or written proof (screenshots are auto-checked and paid instantly unless flagged as a duplicate).
        </p>
      </div>

      {loading && <p className="text-sm text-foreground/50">Loading…</p>}
      {!loading && submissions.length === 0 && <p className="text-sm text-foreground/50">Nothing pending review.</p>}

      <div className="flex flex-col gap-3">
        {submissions.map((s) => (
          <Card key={s.id} className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold">{s.task.title}</p>
              <p className="text-xs text-foreground/50">
                {s.user.fullName} ({s.user.email}) · {new Date(s.createdAt).toLocaleString()}
              </p>
              <p className="mt-1 text-sm font-medium text-brand-primary">Reward if approved: {s.rewardPaid}</p>
              {s.proofUrl && (
                <a
                  href={s.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 flex items-center gap-1 text-sm text-brand-primary underline"
                >
                  <LinkIcon className="h-3.5 w-3.5" /> View submitted link
                </a>
              )}
              {s.proofText && <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/70">{s.proofText}</p>}
            </div>
            <div className="flex flex-none gap-2">
              <Button size="sm" loading={busyId === s.id} onClick={() => approve(s)}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
              </Button>
              <Button size="sm" variant="danger" loading={busyId === s.id} onClick={() => reject(s)}>
                <XCircle className="h-3.5 w-3.5" /> Reject
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

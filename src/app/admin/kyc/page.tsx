"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";

type KycStatus = "UNVERIFIED" | "PENDING" | "APPROVED" | "REJECTED";

interface KycDocument {
  id: string;
  documentType: string;
  fileUrl: string;
  status: KycStatus;
  adminNote: string | null;
  createdAt: string;
  user: { id: string; fullName: string; email: string; kycStatus: KycStatus };
}

const FILTERS: { value: "ALL" | KycStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ALL", label: "All" },
];

export default function AdminKycPage() {
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [filter, setFilter] = useState<"ALL" | KycStatus>("PENDING");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    apiFetch<{ documents: KycDocument[] }>("/api/admin/kyc")
      .then((res) => setDocuments(res.documents))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(doc: KycDocument) {
    setBusyId(doc.id);
    try {
      await apiFetch(`/api/admin/kyc/${doc.id}/approve`, { method: "POST" });
      toast.success(`${doc.user.fullName} verified`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not approve");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(doc: KycDocument) {
    const note = prompt("Reason for rejection (shown to the user):") ?? undefined;
    setBusyId(doc.id);
    try {
      await apiFetch(`/api/admin/kyc/${doc.id}/reject`, { method: "POST", body: JSON.stringify({ note }) });
      toast.success(`${doc.user.fullName}'s submission rejected`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not reject");
    } finally {
      setBusyId(null);
    }
  }

  const filtered = filter === "ALL" ? documents : documents.filter((d) => d.status === filter);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">KYC Review</h1>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === f.value ? "bg-brand-primary text-white" : "bg-surface-muted text-foreground/60"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-foreground/50">Loading…</p>}
      {!loading && filtered.length === 0 && <p className="text-sm text-foreground/50">Nothing here.</p>}

      <div className="flex flex-col gap-3">
        {filtered.map((doc) => (
          <Card key={doc.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin review of a user-uploaded KYC document */}
              <img src={doc.fileUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
              <div>
                <p className="font-semibold">{doc.user.fullName}</p>
                <p className="text-xs text-foreground/50">{doc.user.email}</p>
                <p className="text-xs text-foreground/50">{doc.documentType} · {new Date(doc.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            {doc.status === "PENDING" ? (
              <div className="flex gap-2">
                <Button size="sm" loading={busyId === doc.id} onClick={() => approve(doc)}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button size="sm" variant="danger" loading={busyId === doc.id} onClick={() => reject(doc)}>
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </Button>
              </div>
            ) : (
              <span
                className={`text-xs font-semibold ${doc.status === "APPROVED" ? "text-brand-green" : "text-red-500"}`}
              >
                {doc.status}
              </span>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

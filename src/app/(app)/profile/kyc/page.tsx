"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";

type KycStatus = "UNVERIFIED" | "PENDING" | "APPROVED" | "REJECTED";

interface KycDocument {
  id: string;
  documentType: string;
  status: KycStatus;
  adminNote: string | null;
  createdAt: string;
}

const DOCUMENT_TYPES = [
  { value: "NATIONAL_ID", label: "National ID (NIN)" },
  { value: "VOTERS_CARD", label: "Voter's Card" },
  { value: "DRIVERS_LICENSE", label: "Driver's License" },
  { value: "INTERNATIONAL_PASSPORT", label: "International Passport" },
];

export default function KycPage() {
  const router = useRouter();
  const [kycStatus, setKycStatus] = useState<KycStatus>("UNVERIFIED");
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0].value);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    apiFetch<{ kycStatus: KycStatus; documents: KycDocument[] }>("/api/kyc")
      .then((res) => {
        setKycStatus(res.kycStatus);
        setDocuments(res.documents);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    if (!file) return toast.error("Attach a photo of your document");
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("documentType", documentType);
      form.append("file", file);
      await apiFetch("/api/kyc", { method: "POST", body: form, headers: {} });
      toast.success("Document submitted for review");
      setFile(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not submit document");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="py-10 text-center text-sm text-foreground/50">Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-foreground/60">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div>
        <h1 className="text-xl font-bold">Identity Verification</h1>
        <p className="text-sm text-foreground/60">Verify your identity to help protect your account.</p>
      </div>

      {kycStatus === "APPROVED" ? (
        <Card className="flex flex-col items-center gap-2 py-8 text-center">
          <CheckCircle2 className="h-8 w-8 text-brand-green" />
          <p className="font-semibold text-brand-green">Your identity is verified</p>
        </Card>
      ) : (
        <Card className="flex flex-col gap-3">
          {kycStatus === "PENDING" && (
            <p className="flex items-center gap-1.5 rounded-xl bg-brand-amber/10 px-3 py-2 text-xs text-[#a67c00]">
              <Clock className="h-3.5 w-3.5" /> Your document is under review.
            </p>
          )}
          {kycStatus === "REJECTED" && (
            <p className="flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-500">
              <XCircle className="h-3.5 w-3.5" /> Your last submission was rejected - please resubmit.
            </p>
          )}
          <label className="text-xs font-medium text-foreground/70">Document type</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-primary"
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-6 text-sm text-foreground/60">
            <Upload className="h-4 w-4" />
            {file ? file.name : "Upload a clear photo of your document"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <Button loading={submitting} onClick={submit}>
            Submit for review
          </Button>
        </Card>
      )}

      {documents.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-foreground/70">Submission history</p>
          {documents.map((doc) => (
            <div key={doc.id} className="card flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium">{DOCUMENT_TYPES.find((t) => t.value === doc.documentType)?.label ?? doc.documentType}</p>
                <p className="text-xs text-foreground/50">{new Date(doc.createdAt).toLocaleDateString()}</p>
                {doc.status === "REJECTED" && doc.adminNote && (
                  <p className="mt-1 text-xs text-red-500">{doc.adminNote}</p>
                )}
              </div>
              <span
                className={
                  doc.status === "APPROVED"
                    ? "text-xs font-semibold text-brand-green"
                    : doc.status === "REJECTED"
                      ? "text-xs font-semibold text-red-500"
                      : "text-xs font-semibold text-[#a67c00]"
                }
              >
                {doc.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

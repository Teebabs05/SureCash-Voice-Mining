"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wifi } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { cn, formatCurrency } from "@/lib/utils";
import { MainWalletBalance } from "@/components/bills/main-wallet-balance";

const NETWORKS = [
  { value: "mtn", label: "MTN" },
  { value: "airtel", label: "Airtel" },
  { value: "glo", label: "Glo" },
  { value: "9mobile", label: "9mobile" },
];

interface Variation {
  variationId: string;
  label: string;
  price: number;
  available: boolean;
}

export default function DataPage() {
  const router = useRouter();
  const [network, setNetwork] = useState("mtn");
  const [phone, setPhone] = useState("");
  const [variations, setVariations] = useState<Variation[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadPlans = useCallback((net: string) => {
    apiFetch<{ variations: Variation[] }>(`/api/bills/data/variations?network=${net}`)
      .then((res) => {
        setVariations(res.variations);
        setSelectedPlan(null);
      })
      .catch(() => setVariations([]))
      .finally(() => setLoadingPlans(false));
  }, []);

  useEffect(() => {
    loadPlans(network);
  }, [network, loadPlans]);

  async function submit() {
    if (phone.trim().length < 10) return toast.error("Enter a valid phone number");
    if (!selectedPlan) return toast.error("Choose a data plan");

    setSubmitting(true);
    try {
      const res = await apiFetch<{ purchase: { status: string } }>("/api/bills/data", {
        method: "POST",
        body: JSON.stringify({ phone: phone.trim(), network, variationId: selectedPlan }),
      });
      toast.success(
        res.purchase.status === "SUCCESS"
          ? "Data purchase successful"
          : res.purchase.status === "FAILED"
            ? "Purchase failed - refunded to your wallet"
            : "Purchase submitted - processing"
      );
      router.push("/bills");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Purchase failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-foreground/60">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green/15 text-brand-green">
          <Wifi className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold">Buy Data</h1>
      </div>

      <MainWalletBalance />

      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground/80">Network</label>
          <div className="grid grid-cols-4 gap-2">
            {NETWORKS.map((n) => (
              <button
                key={n.value}
                onClick={() => setNetwork(n.value)}
                className={cn(
                  "rounded-xl border px-2 py-2.5 text-sm font-medium",
                  network === n.value ? "border-brand-primary bg-brand-primary/10 text-brand-primary" : "border-border text-foreground/70"
                )}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>

        <Input label="Phone number" placeholder="080..." value={phone} onChange={(e) => setPhone(e.target.value)} />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground/80">Data plan</label>
          {loadingPlans && <p className="text-xs text-foreground/50">Loading plans...</p>}
          {!loadingPlans && variations.length === 0 && (
            <p className="text-xs text-foreground/50">No plans available for this network right now.</p>
          )}
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {variations
              .filter((v) => v.available)
              .map((v) => (
                <button
                  key={v.variationId}
                  onClick={() => setSelectedPlan(v.variationId)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm",
                    selectedPlan === v.variationId ? "border-brand-primary bg-brand-primary/10" : "border-border"
                  )}
                >
                  <span className="font-medium">{v.label}</span>
                  <span className="text-xs font-semibold text-foreground/60">{formatCurrency(v.price)}</span>
                </button>
              ))}
          </div>
        </div>

        <Button loading={submitting} onClick={submit}>
          Buy Data
        </Button>
      </Card>
    </div>
  );
}

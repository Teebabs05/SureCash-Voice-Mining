"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Tv, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { cn, formatCurrency } from "@/lib/utils";
import { MainWalletBalance } from "@/components/bills/main-wallet-balance";

const PROVIDERS = [
  { value: "dstv", label: "DStv" },
  { value: "gotv", label: "GOtv" },
  { value: "startimes", label: "Startimes" },
  { value: "showmax", label: "Showmax" },
];

interface CustomerInfo {
  name: string;
  currentBouquet?: string;
}

interface Variation {
  variationId: string;
  label: string;
  price: number;
  available: boolean;
}

export default function CableTvPage() {
  const router = useRouter();
  const [provider, setProvider] = useState("dstv");
  const [smartcardNumber, setSmartcardNumber] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedBouquet, setSelectedBouquet] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadVariations = useCallback((p: string) => {
    apiFetch<{ variations: Variation[] }>(`/api/bills/cable-tv/variations?provider=${p}`)
      .then((res) => {
        setVariations(res.variations);
        setSelectedBouquet(null);
      })
      .catch(() => setVariations([]))
      .finally(() => setLoadingPlans(false));
  }, []);

  useEffect(() => {
    loadVariations(provider);
  }, [provider, loadVariations]);

  async function verify() {
    if (smartcardNumber.trim().length < 5) return toast.error("Enter a valid smartcard/IUC number");
    setCustomer(null);
    setVerifying(true);
    try {
      const res = await apiFetch<{ customer: CustomerInfo }>("/api/bills/cable-tv/verify", {
        method: "POST",
        body: JSON.stringify({ smartcardNumber: smartcardNumber.trim(), provider }),
      });
      setCustomer(res.customer);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not verify smartcard number");
    } finally {
      setVerifying(false);
    }
  }

  async function submit() {
    if (!customer) return toast.error("Verify the smartcard number first");
    if (!selectedBouquet) return toast.error("Choose a bouquet");

    setSubmitting(true);
    try {
      const res = await apiFetch<{ purchase: { status: string } }>("/api/bills/cable-tv", {
        method: "POST",
        body: JSON.stringify({ smartcardNumber: smartcardNumber.trim(), provider, variationId: selectedBouquet }),
      });
      toast.success(
        res.purchase.status === "SUCCESS"
          ? "Subscription successful"
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
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15 text-red-500">
          <Tv className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold">Cable TV Subscription</h1>
      </div>

      <MainWalletBalance />

      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground/80">Provider</label>
          <div className="grid grid-cols-4 gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  setProvider(p.value);
                  setCustomer(null);
                }}
                className={cn(
                  "rounded-xl border px-2 py-2.5 text-xs font-medium",
                  provider === p.value ? "border-brand-primary bg-brand-primary/10 text-brand-primary" : "border-border text-foreground/70"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-2">
          <Input
            label="Smartcard / IUC number"
            value={smartcardNumber}
            onChange={(e) => {
              setSmartcardNumber(e.target.value);
              setCustomer(null);
            }}
          />
          <Button variant="outline" loading={verifying} onClick={verify}>
            Verify
          </Button>
        </div>

        {customer && (
          <div className="flex items-start gap-2 rounded-xl bg-brand-green/10 p-3 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-brand-green" />
            <div>
              <p className="font-semibold">{customer.name}</p>
              {customer.currentBouquet && <p className="text-xs text-foreground/60">Current: {customer.currentBouquet}</p>}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground/80">Bouquet</label>
          {loadingPlans && <p className="text-xs text-foreground/50">Loading bouquets...</p>}
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {variations
              .filter((v) => v.available)
              .map((v) => (
                <button
                  key={v.variationId}
                  onClick={() => setSelectedBouquet(v.variationId)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm",
                    selectedBouquet === v.variationId ? "border-brand-primary bg-brand-primary/10" : "border-border"
                  )}
                >
                  <span className="font-medium">{v.label}</span>
                  <span className="text-xs font-semibold text-foreground/60">{formatCurrency(v.price)}</span>
                </button>
              ))}
          </div>
        </div>

        <Button loading={submitting} disabled={!customer} onClick={submit}>
          Subscribe
        </Button>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { MainWalletBalance } from "@/components/bills/main-wallet-balance";

const NETWORKS = [
  { value: "mtn", label: "MTN" },
  { value: "airtel", label: "Airtel" },
  { value: "glo", label: "Glo" },
  { value: "9mobile", label: "9mobile" },
];

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export default function AirtimePage() {
  const router = useRouter();
  const [network, setNetwork] = useState("mtn");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const amountNumber = Number(amount);
    if (phone.trim().length < 10) return toast.error("Enter a valid phone number");
    if (!amountNumber || amountNumber <= 0) return toast.error("Enter a valid amount");

    setSubmitting(true);
    try {
      const res = await apiFetch<{ purchase: { status: string } }>("/api/bills/airtime", {
        method: "POST",
        body: JSON.stringify({ phone: phone.trim(), network, amount: amountNumber }),
      });
      toast.success(
        res.purchase.status === "SUCCESS"
          ? "Airtime purchase successful"
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
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
          <Smartphone className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold">Buy Airtime</h1>
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
          <Input
            label="Amount"
            type="number"
            placeholder="e.g. 500"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((a) => (
              <button
                key={a}
                onClick={() => setAmount(String(a))}
                className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-foreground/70"
              >
                ₦{a}
              </button>
            ))}
          </div>
        </div>

        <Button loading={submitting} onClick={submit}>
          Buy Airtime
        </Button>
      </Card>
    </div>
  );
}

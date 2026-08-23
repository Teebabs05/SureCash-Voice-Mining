"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Dice5, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { MainWalletBalance } from "@/components/bills/main-wallet-balance";

const PROVIDERS = [
  { value: "bet9ja", label: "Bet9ja" },
  { value: "sportybet", label: "SportyBet" },
  { value: "betking", label: "BetKing" },
  { value: "betway", label: "BetWay" },
  { value: "1xbet", label: "1xBet" },
];

interface CustomerInfo {
  name: string;
}

export default function BettingPage() {
  const router = useRouter();
  const [provider, setProvider] = useState("bet9ja");
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function verify() {
    if (customerId.trim().length < 1) return toast.error("Enter your betting account user ID");
    setCustomer(null);
    setVerifying(true);
    try {
      const res = await apiFetch<{ customer: CustomerInfo }>("/api/bills/betting/verify", {
        method: "POST",
        body: JSON.stringify({ customerId: customerId.trim(), provider }),
      });
      setCustomer(res.customer);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not verify account");
    } finally {
      setVerifying(false);
    }
  }

  async function submit() {
    const amountNumber = Number(amount);
    if (customerId.trim().length < 1) return toast.error("Enter your betting account user ID");
    if (!amountNumber || amountNumber <= 0) return toast.error("Enter a valid amount");

    setSubmitting(true);
    try {
      const res = await apiFetch<{ purchase: { status: string } }>("/api/bills/betting", {
        method: "POST",
        body: JSON.stringify({ customerId: customerId.trim(), provider, amount: amountNumber }),
      });
      toast.success(
        res.purchase.status === "SUCCESS"
          ? "Account funded successfully"
          : res.purchase.status === "FAILED"
            ? "Funding failed - refunded to your wallet"
            : "Request submitted - processing"
      );
      router.push("/bills");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Funding failed");
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
          <Dice5 className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold">Fund Betting Account</h1>
      </div>

      <MainWalletBalance />

      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground/80">Betting platform</label>
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              setCustomer(null);
            }}
            className="h-11 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-brand-primary"
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <Input
            label="Account/User ID"
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value);
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
            <p className="font-semibold">{customer.name}</p>
          </div>
        )}

        <Input label="Amount" type="number" placeholder="e.g. 1000" value={amount} onChange={(e) => setAmount(e.target.value)} />

        <Button loading={submitting} onClick={submit}>
          Fund Account
        </Button>
      </Card>
    </div>
  );
}

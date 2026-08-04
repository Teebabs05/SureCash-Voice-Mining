"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Zap, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { MainWalletBalance } from "@/components/bills/main-wallet-balance";

const DISCOS = [
  { value: "ikeja-electric", label: "Ikeja Electric (IKEDC)" },
  { value: "eko-electric", label: "Eko Electric (EKEDC)" },
  { value: "kano-electric", label: "Kano Electric (KEDCO)" },
  { value: "portharcourt-electric", label: "Port Harcourt Electric (PHED)" },
  { value: "jos-electric", label: "Jos Electric (JED)" },
  { value: "ibadan-electric", label: "Ibadan Electric (IBEDC)" },
  { value: "kaduna-electric", label: "Kaduna Electric (KAEDCO)" },
  { value: "abuja-electric", label: "Abuja Electric (AEDC)" },
  { value: "enugu-electric", label: "Enugu Electric (EEDC)" },
  { value: "benin-electric", label: "Benin Electric (BEDC)" },
  { value: "aba-electric", label: "Aba Electric (ABEDC)" },
  { value: "yola-electric", label: "Yola Electric (YEDC)" },
];

interface CustomerInfo {
  name: string;
  address?: string;
}

export default function ElectricityPage() {
  const router = useRouter();
  const [disco, setDisco] = useState("ikeja-electric");
  const [meterType, setMeterType] = useState<"prepaid" | "postpaid">("prepaid");
  const [meterNumber, setMeterNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function verify() {
    if (meterNumber.trim().length < 5) return toast.error("Enter a valid meter number");
    setCustomer(null);
    setVerifying(true);
    try {
      const res = await apiFetch<{ customer: CustomerInfo }>("/api/bills/electricity/verify", {
        method: "POST",
        body: JSON.stringify({ meterNumber: meterNumber.trim(), disco, meterType }),
      });
      setCustomer(res.customer);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not verify meter number");
    } finally {
      setVerifying(false);
    }
  }

  async function submit() {
    const amountNumber = Number(amount);
    if (!customer) return toast.error("Verify the meter number first");
    if (!amountNumber || amountNumber <= 0) return toast.error("Enter a valid amount");

    setSubmitting(true);
    try {
      const res = await apiFetch<{ purchase: { status: string; token: string | null } }>("/api/bills/electricity", {
        method: "POST",
        body: JSON.stringify({ meterNumber: meterNumber.trim(), disco, meterType, amount: amountNumber }),
      });
      if (res.purchase.status === "SUCCESS") {
        toast.success(res.purchase.token ? `Token: ${res.purchase.token}` : "Purchase successful", { duration: 15000 });
      } else if (res.purchase.status === "FAILED") {
        toast.error("Purchase failed - refunded to your wallet");
      } else {
        toast.success("Purchase submitted - processing");
      }
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
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-amber/15 text-[#a67c00]">
          <Zap className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold">Pay Electricity Bill</h1>
      </div>

      <MainWalletBalance />

      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground/80">Distribution company</label>
          <select
            value={disco}
            onChange={(e) => {
              setDisco(e.target.value);
              setCustomer(null);
            }}
            className="h-11 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-brand-primary"
          >
            {DISCOS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground/80">Meter type</label>
          <div className="grid grid-cols-2 gap-2">
            {(["prepaid", "postpaid"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setMeterType(t);
                  setCustomer(null);
                }}
                className={cn(
                  "rounded-xl border px-2 py-2.5 text-sm font-medium capitalize",
                  meterType === t ? "border-brand-primary bg-brand-primary/10 text-brand-primary" : "border-border text-foreground/70"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-2">
          <Input
            label="Meter number"
            value={meterNumber}
            onChange={(e) => {
              setMeterNumber(e.target.value);
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
              {customer.address && <p className="text-xs text-foreground/60">{customer.address}</p>}
            </div>
          </div>
        )}

        <Input label="Amount" type="number" placeholder="e.g. 5000" value={amount} onChange={(e) => setAmount(e.target.value)} />

        <Button loading={submitting} disabled={!customer} onClick={submit}>
          Pay & Get Token
        </Button>
      </Card>
    </div>
  );
}

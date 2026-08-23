"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Banknote, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const NETWORKS = [
  { value: "mtn", label: "MTN" },
  { value: "airtel", label: "Airtel" },
  { value: "glo", label: "Glo" },
  { value: "9mobile", label: "9mobile" },
];

interface Availability {
  available: boolean;
  sitePhone?: string;
  message?: string;
}

export default function AirtimeToCashPage() {
  const router = useRouter();
  const [network, setNetwork] = useState("mtn");
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [senderPhone, setSenderPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function checkAvailability() {
    setAvailability(null);
    setChecking(true);
    try {
      const res = await apiFetch<{ availability: Availability }>("/api/bills/airtime-to-cash/verify", {
        method: "POST",
        body: JSON.stringify({ network }),
      });
      setAvailability(res.availability);
      if (!res.availability.available) toast.error(res.availability.message ?? "This network isn't available right now");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not check availability");
    } finally {
      setChecking(false);
    }
  }

  async function submit() {
    const amountNumber = Number(amount);
    if (!availability?.available || !availability.sitePhone) return toast.error("Check availability first");
    if (senderPhone.trim().length < 10) return toast.error("Enter the phone number you sent the airtime from");
    if (!amountNumber || amountNumber <= 0) return toast.error("Enter a valid amount");

    setSubmitting(true);
    try {
      await apiFetch("/api/bills/airtime-to-cash", {
        method: "POST",
        body: JSON.stringify({ network, senderPhone: senderPhone.trim(), amount: amountNumber, sitePhone: availability.sitePhone }),
      });
      toast.success("Conversion submitted — your Engagement wallet will be credited once the airtime is confirmed received.", {
        duration: 8000,
      });
      router.push("/bills");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Conversion request failed");
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
          <Banknote className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold">Convert Airtime to Cash</h1>
      </div>

      <div className="card p-4 text-sm text-foreground/60">
        This credits your <span className="font-semibold text-foreground">Engagement</span> wallet, not your deposit
        wallet. A conversion fee applies — the amount credited will be less than the airtime you send.
      </div>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground/80">Network</label>
          <div className="grid grid-cols-4 gap-2">
            {NETWORKS.map((n) => (
              <button
                key={n.value}
                onClick={() => {
                  setNetwork(n.value);
                  setAvailability(null);
                }}
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

        <Button variant="outline" loading={checking} onClick={checkAvailability}>
          Check availability
        </Button>

        {availability?.available && availability.sitePhone && (
          <div className="flex items-start gap-2 rounded-xl bg-brand-green/10 p-3 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-brand-green" />
            <div>
              <p className="font-semibold">Transfer your airtime now</p>
              <p className="text-xs text-foreground/60">
                Send the exact amount to <span className="font-mono font-semibold">{availability.sitePhone}</span> using
                your network&apos;s normal airtime-transfer code, then confirm below.
              </p>
            </div>
          </div>
        )}

        {availability?.available && (
          <>
            <Input
              label="Your phone number (the one you sent airtime from)"
              placeholder="080..."
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
            />
            <Input
              label="Amount sent"
              type="number"
              placeholder="e.g. 1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button loading={submitting} onClick={submit}>
              I&apos;ve sent the airtime — confirm conversion
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}

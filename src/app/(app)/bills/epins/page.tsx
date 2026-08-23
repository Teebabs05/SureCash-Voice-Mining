"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ticket } from "lucide-react";
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

const VALUES = [100, 200, 500];

export default function EpinsPage() {
  const router = useRouter();
  const [network, setNetwork] = useState("mtn");
  const [value, setValue] = useState(100);
  const [quantity, setQuantity] = useState("1");
  const [submitting, setSubmitting] = useState(false);

  const quantityNumber = Number(quantity) || 0;
  const total = value * quantityNumber;

  async function submit() {
    if (quantityNumber < 1 || quantityNumber > 40) return toast.error("Quantity must be between 1 and 40");

    setSubmitting(true);
    try {
      const res = await apiFetch<{ purchase: { status: string; pins: string[] | null } }>("/api/bills/epins", {
        method: "POST",
        body: JSON.stringify({ network, value, quantity: quantityNumber }),
      });
      if (res.purchase.status === "SUCCESS") {
        toast.success(
          res.purchase.pins?.length ? `Pins: ${res.purchase.pins.join(", ")}` : "Purchase successful",
          { duration: 20000 }
        );
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
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
          <Ticket className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold">Print ePINs</h1>
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

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground/80">Pin value</label>
          <div className="grid grid-cols-3 gap-2">
            {VALUES.map((v) => (
              <button
                key={v}
                onClick={() => setValue(v)}
                className={cn(
                  "rounded-xl border px-2 py-2.5 text-sm font-medium",
                  value === v ? "border-brand-primary bg-brand-primary/10 text-brand-primary" : "border-border text-foreground/70"
                )}
              >
                ₦{v}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Quantity"
          type="number"
          min={1}
          max={40}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />

        <p className="text-sm text-foreground/60">
          Total: <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
        </p>

        <Button loading={submitting} onClick={submit}>
          Print {quantityNumber || ""} Pin{quantityNumber === 1 ? "" : "s"}
        </Button>
      </Card>
    </div>
  );
}

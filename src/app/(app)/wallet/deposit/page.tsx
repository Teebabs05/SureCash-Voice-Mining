"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency, cn } from "@/lib/utils";

const GATEWAYS = [
  { method: "PAYSTACK", label: "Paystack" },
  { method: "MONNIFY", label: "Monnify" },
  { method: "KORAPAY", label: "Korapay" },
  { method: "PAYVESSEL", label: "PayVessel" },
  { method: "FLUTTERWAVE", label: "Flutterwave" },
] as const;

interface Deposit {
  id: string;
  amount: string;
  method: string;
  status: string;
  createdAt: string;
}

export default function DepositPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"gateway" | "manual">("gateway");
  const [amount, setAmount] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [deposits, setDeposits] = useState<Deposit[]>([]);

  useEffect(() => {
    apiFetch<{ deposits: Deposit[] }>("/api/deposits").then((res) => setDeposits(res.deposits));
  }, []);

  async function payWithGateway(method: (typeof GATEWAYS)[number]["method"]) {
    if (!amount || Number(amount) <= 0) return toast.error("Enter a valid amount");
    setLoading(true);
    try {
      const res = await apiFetch<{ authorizationUrl: string }>("/api/deposits/initialize", {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount), method }),
      });
      window.location.assign(res.authorizationUrl);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not start payment");
    } finally {
      setLoading(false);
    }
  }

  async function submitManual() {
    if (!amount || Number(amount) <= 0) return toast.error("Enter a valid amount");
    if (!receipt) return toast.error("Attach your deposit receipt");
    setLoading(true);
    try {
      const form = new FormData();
      form.append("amount", amount);
      form.append("receipt", receipt);
      await apiFetch("/api/deposits/manual", { method: "POST", body: form, headers: {} });
      toast.success("Deposit submitted for review");
      setAmount("");
      setReceipt(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not submit deposit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-foreground/60">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-xl font-bold">Fund Wallet</h1>

      <div className="flex gap-2 rounded-xl bg-surface-muted p-1">
        {(["gateway", "manual"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors",
              tab === t ? "bg-surface shadow" : "text-foreground/50"
            )}
          >
            {t === "gateway" ? "Instant" : "Manual bank"}
          </button>
        ))}
      </div>

      <Input
        label="Amount"
        type="number"
        min={1}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
      />

      {tab === "gateway" ? (
        <div className="grid grid-cols-2 gap-3">
          {GATEWAYS.map((g) => (
            <button
              key={g.method}
              disabled={loading}
              onClick={() => payWithGateway(g.method)}
              className="card py-4 text-sm font-semibold disabled:opacity-60"
            >
              {g.label}
            </button>
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-sm text-foreground/70">
            Transfer to our bank account, then upload your receipt below for verification.
          </p>
          <div className="mt-3 rounded-xl bg-surface-muted p-3 text-sm">
            <p>Bank: SureCash Trust MFB</p>
            <p>Account: 0123456789</p>
            <p>Name: SureCash Mining Ltd</p>
          </div>
          <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-6 text-sm text-foreground/60">
            <Upload className="h-4 w-4" />
            {receipt ? receipt.name : "Upload receipt"}
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
            />
          </label>
          <Button className="mt-3 w-full" loading={loading} onClick={submitManual}>
            Submit for review
          </Button>
        </Card>
      )}

      {deposits.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-foreground/70">Recent deposits</h2>
          <div className="flex flex-col gap-2">
            {deposits.map((d) => (
              <Card key={d.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium">{formatCurrency(d.amount)}</p>
                  <p className="text-xs text-foreground/50">{d.method} · {new Date(d.createdAt).toLocaleDateString()}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    d.status === "APPROVED" && "bg-brand-green/15 text-brand-green",
                    d.status === "PENDING" && "bg-brand-gold/15 text-[#a67c00]",
                    d.status === "REJECTED" && "bg-red-500/15 text-red-500"
                  )}
                >
                  {d.status}
                </span>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Copy, ArrowRight, Landmark } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency, cn } from "@/lib/utils";

interface VirtualAccount {
  accountNumber: string;
  accountName: string;
  bankName: string;
}

interface DepositMethods {
  gatewayEnabled: boolean;
  virtualAccountEnabled: boolean;
  manual: {
    enabled: boolean;
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

const GATEWAYS = [
  { method: "PAYSTACK", label: "Paystack" },
  { method: "MONNIFY", label: "Monnify" },
  { method: "KORAPAY", label: "Korapay" },
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
  const [tab, setTab] = useState<"gateway" | "transfer" | "manual">("gateway");
  const [amount, setAmount] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [manualStep, setManualStep] = useState<"amount" | "transfer" | "upload">("amount");
  const [loading, setLoading] = useState(false);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccount | null>(null);
  const [virtualAccountError, setVirtualAccountError] = useState<string | null>(null);
  const [virtualAccountLoading, setVirtualAccountLoading] = useState(false);
  const [virtualAccountAttempted, setVirtualAccountAttempted] = useState(false);
  const [methods, setMethods] = useState<DepositMethods | null>(null);

  useEffect(() => {
    apiFetch<{ deposits: Deposit[] }>("/api/deposits").then((res) => setDeposits(res.deposits));
    apiFetch<DepositMethods>("/api/deposits/methods").then((res) => {
      setMethods(res);
      if (!res.gatewayEnabled) {
        setTab(res.virtualAccountEnabled ? "transfer" : "manual");
      }
    });
  }, []);

  useEffect(() => {
    if (tab !== "transfer" || virtualAccountAttempted) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVirtualAccountAttempted(true);
    setVirtualAccountLoading(true);
    apiFetch<{ account: VirtualAccount }>("/api/wallet/virtual-account")
      .then((res) => setVirtualAccount(res.account))
      .catch((err) => setVirtualAccountError(err instanceof ApiError ? err.message : "Could not load your account"))
      .finally(() => setVirtualAccountLoading(false));
  }, [tab, virtualAccountAttempted]);

  function copyAccountNumber() {
    if (!virtualAccount) return;
    navigator.clipboard.writeText(virtualAccount.accountNumber);
    toast.success("Account number copied");
  }

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
      setManualStep("amount");
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

      {methods && !methods.gatewayEnabled && !methods.virtualAccountEnabled && !methods.manual.enabled && (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">
          Deposits are temporarily unavailable. Please check back later.
        </p>
      )}

      {methods && (methods.gatewayEnabled || methods.virtualAccountEnabled || methods.manual.enabled) && (
        <div className="flex gap-2 rounded-xl bg-surface-muted p-1">
          {(["gateway", "transfer", "manual"] as const)
            .filter(
              (t) =>
                (t === "gateway" && methods.gatewayEnabled) ||
                (t === "transfer" && methods.virtualAccountEnabled) ||
                (t === "manual" && methods.manual.enabled)
            )
            .map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors",
                  tab === t ? "bg-surface shadow" : "text-foreground/50"
                )}
              >
                {t === "gateway" ? "Instant" : t === "transfer" ? "Bank transfer" : "Manual"}
              </button>
            ))}
        </div>
      )}

      {tab === "gateway" && (
        <Input
          label="Amount"
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
        />
      )}

      {tab === "gateway" && (
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
      )}

      {tab === "transfer" && (
        <Card>
          <p className="text-sm text-foreground/70">
            Transfer any amount to this dedicated account number — it&apos;s credited to your Main wallet
            automatically, no receipt needed.
          </p>
          {virtualAccountLoading && <p className="mt-3 text-sm text-foreground/50">Setting up your account…</p>}
          {virtualAccountError && <p className="mt-3 text-sm text-red-500">{virtualAccountError}</p>}
          {virtualAccount && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-muted p-3 text-sm">
              <div>
                <p className="text-lg font-bold tracking-wide">{virtualAccount.accountNumber}</p>
                <p className="text-foreground/70">{virtualAccount.bankName}</p>
                <p className="text-foreground/70">{virtualAccount.accountName}</p>
              </div>
              <button onClick={copyAccountNumber} className="rounded-lg bg-surface p-2 shadow">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          )}
        </Card>
      )}

      {tab === "manual" && manualStep === "amount" && (
        <Card>
          <p className="text-sm text-foreground/70">
            A fallback for when instant payment gateways are down. Enter the amount you&apos;re sending, then
            transfer to our bank account and upload your receipt for admin review.
          </p>
          <Input
            className="mt-3"
            label="Amount"
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
          <Button
            className="mt-3 w-full"
            onClick={() => {
              if (!amount || Number(amount) <= 0) return toast.error("Enter a valid amount");
              setManualStep("transfer");
            }}
          >
            Continue
          </Button>
        </Card>
      )}

      {tab === "manual" && manualStep === "transfer" && methods?.manual.enabled && (
        <Card>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted">
              <Landmark className="h-6 w-6 text-foreground/60" />
            </div>
            <p className="text-2xl font-bold">Pay {formatCurrency(amount)}</p>
            <p className="text-sm text-foreground/60">
              Please proceed to your mobile banking app to complete your bank transfer to {methods.manual.accountName}.
            </p>
          </div>

          <div className="mt-4 flex flex-col divide-y divide-border rounded-xl bg-surface-muted px-4">
            <div className="flex items-center justify-between py-3 text-sm">
              <span className="text-foreground/60">Amount</span>
              <span className="font-semibold">{formatCurrency(amount)}</span>
            </div>
            <div className="flex items-center justify-between py-3 text-sm">
              <span className="text-foreground/60">Account number</span>
              <span className="font-semibold">{methods.manual.accountNumber}</span>
            </div>
            <div className="flex items-center justify-between py-3 text-sm">
              <span className="text-foreground/60">Bank name</span>
              <span className="font-semibold">{methods.manual.bankName}</span>
            </div>
          </div>

          <Button className="mt-4 w-full" variant="secondary" onClick={() => setManualStep("upload")}>
            I have completed the transfer <ArrowRight className="h-4 w-4" />
          </Button>
          <button
            onClick={() => setManualStep("amount")}
            className="mt-2 w-full text-center text-xs text-foreground/50"
          >
            Change amount
          </button>
        </Card>
      )}

      {tab === "manual" && manualStep === "upload" && (
        <Card>
          <p className="text-sm text-foreground/70">
            Upload your receipt for {formatCurrency(amount)} so an admin can verify and credit your wallet.
          </p>
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
          <button
            onClick={() => setManualStep("transfer")}
            className="mt-2 w-full text-center text-xs text-foreground/50"
          >
            Back
          </button>
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
                    d.status === "PENDING" && "bg-brand-amber/15 text-[#a67c00]",
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

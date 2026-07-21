"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Copy, ArrowRight, Landmark, ShieldCheck, CreditCard } from "lucide-react";
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
  gateways: Record<string, boolean>;
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

type GatewayMethod = (typeof GATEWAYS)[number]["method"];

type ResolvedMethod =
  | { kind: "gateway"; method: GatewayMethod }
  | { kind: "virtual" }
  | { kind: "manual" };

/** Picks the single method "Pay now" should actually use, in priority
 * order, when the admin has more than one deposit method switched on at
 * once: an online gateway first (using the highest-priority gateway that's
 * enabled), then the dedicated virtual account, then manual bank transfer. */
function resolveMethod(methods: DepositMethods | null): ResolvedMethod | null {
  if (!methods) return null;
  if (methods.gatewayEnabled) {
    const gateway = GATEWAYS.find((g) => methods.gateways[g.method]);
    if (gateway) return { kind: "gateway", method: gateway.method };
  }
  if (methods.virtualAccountEnabled) return { kind: "virtual" };
  if (methods.manual.enabled) return { kind: "manual" };
  return null;
}

interface Deposit {
  id: string;
  amount: string;
  method: string;
  status: string;
  createdAt: string;
}

interface PlanLite {
  price: string;
}

export default function DepositPage() {
  const router = useRouter();
  const [step, setStep] = useState<"amount" | "virtual" | "manual">("amount");
  const [manualStep, setManualStep] = useState<"transfer" | "upload">("transfer");
  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccount | null>(null);
  const [virtualAccountError, setVirtualAccountError] = useState<string | null>(null);
  const [virtualAccountLoading, setVirtualAccountLoading] = useState(false);
  const [virtualAccountAttempted, setVirtualAccountAttempted] = useState(false);
  const [methods, setMethods] = useState<DepositMethods | null>(null);
  const [chips, setChips] = useState<number[]>([]);

  useEffect(() => {
    apiFetch<{ deposits: Deposit[] }>("/api/deposits").then((res) => setDeposits(res.deposits));
    apiFetch<DepositMethods>("/api/deposits/methods").then(setMethods);
    apiFetch<{ plans: PlanLite[] }>("/api/plans")
      .then((res) => setChips([...new Set(res.plans.map((p) => Number(p.price)))].sort((a, b) => a - b)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (step !== "virtual" || virtualAccountAttempted) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVirtualAccountAttempted(true);
    setVirtualAccountLoading(true);
    apiFetch<{ account: VirtualAccount }>("/api/wallet/virtual-account")
      .then((res) => setVirtualAccount(res.account))
      .catch((err) => setVirtualAccountError(err instanceof ApiError ? err.message : "Could not load your account"))
      .finally(() => setVirtualAccountLoading(false));
  }, [step, virtualAccountAttempted]);

  const resolved = useMemo(() => resolveMethod(methods), [methods]);

  function copyAccountNumber() {
    if (!virtualAccount) return;
    navigator.clipboard.writeText(virtualAccount.accountNumber);
    toast.success("Account number copied");
  }

  async function payWithGateway(method: GatewayMethod) {
    setLoading(true);
    try {
      const res = await apiFetch<{ authorizationUrl: string }>("/api/deposits/initialize", {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount), method }),
      });
      window.location.assign(res.authorizationUrl);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not start payment");
      setLoading(false);
    }
  }

  async function submitManual() {
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
      setManualStep("transfer");
      setStep("amount");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not submit deposit");
    } finally {
      setLoading(false);
    }
  }

  function openConfirm() {
    if (!amount || Number(amount) <= 0) return toast.error("Enter a valid amount");
    if (!resolved) return toast.error("Deposits are temporarily unavailable. Please check back later.");
    setShowConfirm(true);
  }

  function payNow() {
    if (!resolved) return;
    if (resolved.kind === "gateway") {
      payWithGateway(resolved.method);
      return;
    }
    setShowConfirm(false);
    if (resolved.kind === "virtual") setStep("virtual");
    if (resolved.kind === "manual") setStep("manual");
  }

  function backToAmount() {
    setStep("amount");
    setManualStep("transfer");
  }

  const noMethodsActive = methods && !resolved;

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-foreground/60">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-xl font-bold">Fund Wallet</h1>

      {noMethodsActive && (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">
          Deposits are temporarily unavailable. Please check back later.
        </p>
      )}

      {step === "amount" && (
        <Card>
          <p className="font-semibold">How much do you want to add?</p>
          <Input
            className="mt-3"
            label="Amount"
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
          {chips.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setAmount(String(chip))}
                  className={cn(
                    "rounded-xl border py-3 text-sm font-bold transition-colors",
                    Number(amount) === chip
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-border bg-surface text-brand-primary"
                  )}
                >
                  {formatCurrency(chip).replace(".00", "")}
                </button>
              ))}
            </div>
          )}
          <Button className="mt-4 w-full" onClick={openConfirm} disabled={!resolved}>
            Continue
          </Button>
        </Card>
      )}

      {step === "virtual" && (
        <Card>
          <button onClick={backToAmount} className="mb-2 flex items-center gap-1 text-xs text-foreground/50">
            <ArrowLeft className="h-3.5 w-3.5" /> Change amount
          </button>
          <p className="text-sm text-foreground/70">
            Transfer <span className="font-bold text-foreground">{formatCurrency(amount)}</span> to this dedicated
            account number — it&apos;s credited to your Main wallet automatically, no receipt needed.
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

      {step === "manual" && manualStep === "transfer" && methods?.manual.enabled && (
        <Card>
          <button onClick={backToAmount} className="mb-2 flex items-center gap-1 text-xs text-foreground/50">
            <ArrowLeft className="h-3.5 w-3.5" /> Change amount
          </button>
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
        </Card>
      )}

      {step === "manual" && manualStep === "upload" && (
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
          <button onClick={() => setManualStep("transfer")} className="mt-2 w-full text-center text-xs text-foreground/50">
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

      {showConfirm && resolved && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirm(false)} />
          <div className="relative w-full rounded-t-3xl bg-surface px-6 pb-8 pt-3 shadow-xl">
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-lg font-bold">Fund your wallet</h2>
              <p className="mt-1 text-sm text-foreground/60">
                {resolved.kind === "gateway" && "You'll pay securely via card, bank transfer or USSD"}
                {resolved.kind === "virtual" && "You'll pay securely via bank transfer to your dedicated account"}
                {resolved.kind === "manual" && "You'll pay via bank transfer and upload your receipt for review"}
              </p>
              <p className="mt-3 text-3xl font-extrabold text-brand-primary">{formatCurrency(amount)}</p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-foreground/50">
                <ShieldCheck className="h-3.5 w-3.5" />
                {resolved.kind === "gateway"
                  ? "Card · Bank transfer · USSD - encrypted & secure"
                  : "Encrypted & secure"}
              </p>

              <Button className="mt-6 w-full" loading={loading} onClick={payNow}>
                <CreditCard className="h-4 w-4" /> Pay now
              </Button>
              <button
                onClick={() => setShowConfirm(false)}
                className="mt-2 flex h-11 w-full items-center justify-center rounded-xl border border-border text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

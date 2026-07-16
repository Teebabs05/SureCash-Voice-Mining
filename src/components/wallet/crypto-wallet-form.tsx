"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { CRYPTO_NETWORKS, isValidCryptoAddress, type CryptoNetworkId } from "@/lib/payments/crypto-wallet";
import { cn } from "@/lib/utils";

interface CryptoWallet {
  id: string;
  address: string;
  network: string;
  isVerified: boolean;
}

export function CryptoWalletForm({ onAdded }: { onAdded: (wallet: CryptoWallet) => void }) {
  const [network, setNetwork] = useState<CryptoNetworkId>("TRC20");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const trimmed = address.trim();
  const formatOk = trimmed.length > 0 && isValidCryptoAddress(network, trimmed);
  const showFormatError = trimmed.length > 10 && !formatOk;

  async function save() {
    setSubmitting(true);
    try {
      const res = await apiFetch<{ wallet: CryptoWallet }>("/api/crypto-wallets", {
        method: "POST",
        body: JSON.stringify({ network, address: trimmed }),
      });
      onAdded(res.wallet);
      setAddress("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not add wallet");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        {CRYPTO_NETWORKS.map((n) => (
          <button
            key={n.id}
            onClick={() => setNetwork(n.id)}
            className={cn(
              "rounded-xl border px-2 py-2 text-xs font-medium",
              network === n.id ? "border-brand-primary bg-brand-primary/5 text-brand-primary" : "border-border text-foreground/60"
            )}
          >
            {n.id}
          </button>
        ))}
      </div>

      <Input
        placeholder={network === "TRC20" ? "T..." : "0x..."}
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      {formatOk && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-brand-green">
          <CheckCircle2 className="h-3.5 w-3.5" /> Valid {network} address format
        </p>
      )}
      {showFormatError && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red-500">
          <AlertTriangle className="h-3.5 w-3.5" /> Doesn&apos;t look like a valid {network} address
        </p>
      )}
      <p className="text-xs text-foreground/50">
        Only address format is validated automatically — double-check it yourself, sending USDT to the wrong network or an
        incorrect address can&apos;t be reversed.
      </p>

      <Button loading={submitting} disabled={!formatOk} onClick={save}>
        Save & send OTP
      </Button>
    </div>
  );
}

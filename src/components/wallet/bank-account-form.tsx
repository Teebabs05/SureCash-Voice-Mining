"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Search, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Bank {
  code: string;
  name: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  autoVerified: boolean;
  isVerified: boolean;
  reviewNote: string | null;
}

export function BankAccountForm({ onAdded }: { onAdded: (account: BankAccount) => void }) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankQuery, setBankQuery] = useState("");
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");

  const [resolving, setResolving] = useState(false);
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [providerConfigured, setProviderConfigured] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    apiFetch<{ banks: Bank[] }>("/api/banks").then((res) => setBanks(res.banks));
  }, []);

  useEffect(() => {
    // Reset the previous lookup result whenever the inputs change so a stale
    // resolved name/error can't linger against a different bank/account pair.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResolvedName(null);
    setResolveError(null);

    if (!selectedBank || accountNumber.length !== 10) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setResolving(true);
      try {
        const res = await apiFetch<{ configured: boolean; verified: boolean; accountName: string | null }>(
          "/api/bank-accounts/resolve",
          { method: "POST", body: JSON.stringify({ bankCode: selectedBank.code, accountNumber }) }
        );
        setProviderConfigured(res.configured);
        if (res.verified && res.accountName) setResolvedName(res.accountName);
      } catch (err) {
        setResolveError(err instanceof ApiError ? err.message : "Could not verify this account");
      } finally {
        setResolving(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [selectedBank, accountNumber]);

  const filteredBanks = bankQuery
    ? banks.filter((b) => b.name.toLowerCase().includes(bankQuery.toLowerCase()))
    : banks;

  const canSave = Boolean(selectedBank) && accountNumber.length === 10 && !resolving && !resolveError && (resolvedName || !providerConfigured);

  async function save() {
    if (!selectedBank) return;
    setSubmitting(true);
    try {
      const res = await apiFetch<{ account: BankAccount }>("/api/bank-accounts", {
        method: "POST",
        body: JSON.stringify({ bankCode: selectedBank.code, accountNumber }),
      });
      onAdded(res.account);
      setSelectedBank(null);
      setBankQuery("");
      setAccountNumber("");
      setResolvedName(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not add bank account");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Input
          placeholder="Search for your bank"
          value={selectedBank ? selectedBank.name : bankQuery}
          onFocus={() => setShowDropdown(true)}
          onChange={(e) => {
            setSelectedBank(null);
            setBankQuery(e.target.value);
            setShowDropdown(true);
          }}
        />
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/30" />
        {showDropdown && !selectedBank && (
          <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
            {filteredBanks.length === 0 && <p className="p-3 text-xs text-foreground/50">No banks found</p>}
            {filteredBanks.map((b) => (
              <button
                key={b.code}
                onClick={() => {
                  setSelectedBank(b);
                  setShowDropdown(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-muted"
              >
                {b.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <Input
        placeholder="10-digit account number"
        value={accountNumber}
        maxLength={10}
        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
      />

      {resolving && (
        <p className="flex items-center gap-1.5 text-xs text-foreground/50">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying account…
        </p>
      )}
      {resolvedName && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-brand-green">
          <CheckCircle2 className="h-3.5 w-3.5" /> {resolvedName}
        </p>
      )}
      {resolveError && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red-500">
          <ShieldAlert className="h-3.5 w-3.5" /> {resolveError}
        </p>
      )}
      {!providerConfigured && accountNumber.length === 10 && !resolveError && (
        <p className="text-xs text-foreground/50">
          Automatic verification isn&apos;t configured — this account will be reviewed manually before withdrawals are paid out.
        </p>
      )}

      <Button loading={submitting} disabled={!canSave} onClick={save} className={cn(!canSave && "opacity-50")}>
        Save & send OTP
      </Button>
    </div>
  );
}

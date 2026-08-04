"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

/** Bills/VTU purchases only ever draw from MAIN (the deposit wallet) - shown so users know what balance a purchase will use, distinct from their Engagement/Sales earnings. */
export function MainWalletBalance({ onBalance }: { onBalance?: (balance: number) => void }) {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<{ wallets: { type: string; balance: string }[] }>("/api/wallet").then((res) => {
      const main = res.wallets.find((w) => w.type === "MAIN");
      const value = main ? Number(main.balance) : 0;
      setBalance(value);
      onBalance?.(value);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="card flex items-center justify-between p-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
          <Wallet className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-xs text-foreground/50">Wallet balance</p>
          <p className="text-sm font-bold">{balance === null ? "..." : formatCurrency(balance)}</p>
        </div>
      </div>
      <Link href="/wallet/deposit" className="text-xs font-semibold text-brand-primary">
        Add funds
      </Link>
    </div>
  );
}

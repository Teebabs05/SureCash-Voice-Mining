"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, cn } from "@/lib/utils";
import { WALLET_META, WALLET_ORDER } from "@/lib/wallet-meta";
import type { WalletType } from "@prisma/client";

interface WalletTxn {
  id: string;
  type: "CREDIT" | "DEBIT";
  reason: string;
  amount: string;
  description: string | null;
  createdAt: string;
  wallet: { type: WalletType };
}

export default function TransactionHistoryPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<WalletType | "ALL">("ALL");
  const [transactions, setTransactions] = useState<WalletTxn[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback((type: WalletType | "ALL") => {
    const params = type === "ALL" ? "" : `?type=${type}`;
    apiFetch<{ transactions: WalletTxn[]; nextCursor: string | null }>(`/api/wallet/transactions${params}`)
      .then((res) => {
        setTransactions(res.transactions);
        setCursor(res.nextCursor);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ cursor });
      if (filter !== "ALL") params.set("type", filter);
      const res = await apiFetch<{ transactions: WalletTxn[]; nextCursor: string | null }>(
        `/api/wallet/transactions?${params.toString()}`
      );
      setTransactions((prev) => [...prev, ...res.transactions]);
      setCursor(res.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-foreground/60">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-xl font-bold">Transaction History</h1>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter("ALL")}
          className={cn(
            "flex-none rounded-full px-3.5 py-1.5 text-xs font-semibold",
            filter === "ALL" ? "gradient-brand text-white" : "bg-surface-muted text-foreground/60"
          )}
        >
          All
        </button>
        {WALLET_ORDER.map((w) => (
          <button
            key={w}
            onClick={() => setFilter(w)}
            className={cn(
              "flex-none rounded-full px-3.5 py-1.5 text-xs font-semibold",
              filter === w ? "gradient-brand text-white" : "bg-surface-muted text-foreground/60"
            )}
          >
            {WALLET_META[w].label}
          </button>
        ))}
      </div>

      <div className="card flex flex-col divide-y divide-border p-0">
        {loading && <p className="py-10 text-center text-sm text-foreground/50">Loading…</p>}
        {!loading && transactions.length === 0 && (
          <p className="py-10 text-center text-sm text-foreground/50">No transactions yet</p>
        )}
        {transactions.map((txn) => (
          <div key={txn.id} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">{txn.description ?? txn.reason.replaceAll("_", " ")}</p>
              <p className="text-xs text-foreground/50">
                {WALLET_META[txn.wallet.type].label} · {new Date(txn.createdAt).toLocaleString()}
              </p>
            </div>
            <span className={cn("text-sm font-semibold", txn.type === "CREDIT" ? "text-brand-green" : "text-red-500")}>
              {txn.type === "CREDIT" ? "+" : "-"}
              {formatCurrency(txn.amount)}
            </span>
          </div>
        ))}
      </div>

      {cursor && (
        <Button variant="outline" loading={loadingMore} onClick={loadMore}>
          Load more
        </Button>
      )}
    </div>
  );
}

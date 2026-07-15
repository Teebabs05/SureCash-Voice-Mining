"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { WALLET_META, WALLET_ORDER } from "@/lib/wallet-meta";
import { formatCurrency, cn } from "@/lib/utils";
import type { WalletType } from "@prisma/client";

export interface WalletCardData {
  type: WalletType;
  balance: number;
  todayEarnings?: number;
}

export function WalletCarousel({ wallets }: { wallets: WalletCardData[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const ordered = WALLET_ORDER.map((type) => wallets.find((w) => w.type === type)).filter(
    (w): w is WalletCardData => Boolean(w)
  );

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive(index);
  }

  return (
    <div>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1"
      >
        {ordered.map((wallet) => {
          const meta = WALLET_META[wallet.type];
          const Icon = meta.icon;
          return (
            <div
              key={wallet.type}
              className={cn(
                "relative flex w-full flex-none snap-center flex-col justify-between rounded-[1.75rem] p-5 text-white shadow-lg",
                meta.gradient
              )}
              style={{ minWidth: "100%" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-white/20 p-2">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-white/90">{meta.label}</span>
                </div>
                {wallet.type === "MAIN" && (
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    Withdrawable
                  </span>
                )}
              </div>

              <div className="my-4">
                <p className="text-3xl font-bold tracking-tight">{formatCurrency(wallet.balance)}</p>
                <p className="mt-1 text-xs text-white/75">{meta.description}</p>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/wallet/withdraw"
                  className="flex-1 rounded-xl bg-white/15 py-2 text-center text-xs font-semibold backdrop-blur transition-colors hover:bg-white/25"
                >
                  Withdraw
                </Link>
                <Link
                  href="/wallet/deposit"
                  className="flex-1 rounded-xl bg-white py-2 text-center text-xs font-semibold text-[#1a1330] transition-colors hover:bg-white/90"
                >
                  Fund Wallet
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex justify-center gap-1.5">
        {ordered.map((wallet, i) => (
          <span
            key={wallet.type}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === active ? "w-5 bg-brand-purple" : "w-1.5 bg-border"
            )}
          />
        ))}
      </div>
    </div>
  );
}

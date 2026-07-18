"use client";

import { useState } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useTransform,
  useMotionValueEvent,
  animate,
} from "framer-motion";
import { WALLET_META, WALLET_ORDER } from "@/lib/wallet-meta";
import { formatCurrency, cn } from "@/lib/utils";
import type { WalletType } from "@prisma/client";

export interface WalletCardData {
  type: WalletType;
  balance: number;
  todayEarnings?: number;
}

const SWIPE_OFFSET_THRESHOLD = 90;
const SWIPE_VELOCITY_THRESHOLD = 500;
const FLY_OUT_DISTANCE = 420;

function CardFace({ wallet }: { wallet: WalletCardData }) {
  const meta = WALLET_META[wallet.type];
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col justify-between rounded-[1.75rem] p-5 text-white shadow-lg",
        meta.gradient
      )}
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
}

export function WalletCarousel({ wallets }: { wallets: WalletCardData[] }) {
  const ordered = WALLET_ORDER.map((type) => wallets.find((w) => w.type === type)).filter(
    (w): w is WalletCardData => Boolean(w)
  );

  const [active, setActive] = useState(0);
  const [dragDir, setDragDir] = useState<1 | -1>(1);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-FLY_OUT_DISTANCE, FLY_OUT_DISTANCE], [-14, 14]);
  const peekOpacity = useTransform(x, [-160, -30, 0, 30, 160], [1, 0.5, 0.35, 0.5, 1]);
  const peekScale = useTransform(x, [-160, 0, 160], [1, 0.9, 1]);

  useMotionValueEvent(x, "change", (latest) => {
    if (latest < -1 && dragDir !== 1) setDragDir(1);
    else if (latest > 1 && dragDir !== -1) setDragDir(-1);
  });

  if (ordered.length === 0) return null;

  const count = ordered.length;
  const peekIndex = dragDir === 1 ? (active + 1) % count : (active - 1 + count) % count;

  function flyToStep(direction: 1 | -1) {
    const next = (active + direction + count) % count;
    animate(x, -direction * FLY_OUT_DISTANCE, { duration: 0.22, ease: "easeIn" }).then(() => {
      setActive(next);
      x.jump(0);
    });
  }

  function jumpTo(target: number) {
    if (target === active) return;
    setDragDir(target > active ? 1 : -1);
    animate(x, target > active ? -FLY_OUT_DISTANCE : FLY_OUT_DISTANCE, { duration: 0.22, ease: "easeIn" }).then(() => {
      setActive(target);
      x.jump(0);
    });
  }

  function onDragEnd(_: unknown, info: { offset: { x: number }; velocity: { x: number } }) {
    if (info.offset.x < -SWIPE_OFFSET_THRESHOLD || info.velocity.x < -SWIPE_VELOCITY_THRESHOLD) {
      flyToStep(1);
    } else if (info.offset.x > SWIPE_OFFSET_THRESHOLD || info.velocity.x > SWIPE_VELOCITY_THRESHOLD) {
      flyToStep(-1);
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 32 });
    }
  }

  // Static slivers of the card(s) behind, always visible (not tied to drag
  // position) so it reads as a stack at rest, not just mid-swipe.
  const stackBehind = [1, 2]
    .filter((offset) => offset < count)
    .map((offset) => ordered[(active + offset) % count])
    .reverse();

  return (
    <div>
      <div className="relative h-[240px]">
        {stackBehind.map((wallet, i) => (
          <div
            key={`stack-${wallet.type}`}
            className={cn("absolute inset-x-0 top-0 rounded-[1.75rem]", WALLET_META[wallet.type].gradient)}
            style={{
              height: "100%",
              transform: `translateY(${-8 * (stackBehind.length - i)}px) scale(${1 - 0.04 * (stackBehind.length - i)})`,
              opacity: 0.55 - i * 0.15,
            }}
          />
        ))}

        <motion.div
          key={`peek-${ordered[peekIndex].type}`}
          className="absolute inset-0"
          style={{ opacity: peekOpacity, scale: peekScale }}
        >
          <CardFace wallet={ordered[peekIndex]} />
        </motion.div>

        <motion.div
          key={`front-${ordered[active].type}`}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          style={{ x, rotate }}
          drag="x"
          dragMomentum={false}
          onDragEnd={onDragEnd}
        >
          <CardFace wallet={ordered[active]} />
        </motion.div>
      </div>

      <div className="mt-3 flex justify-center gap-1.5">
        {ordered.map((wallet, i) => (
          <button
            key={wallet.type}
            aria-label={`Show ${WALLET_META[wallet.type].label}`}
            onClick={() => jumpTo(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === active ? "w-5 bg-brand-primary" : "w-1.5 bg-border"
            )}
          />
        ))}
      </div>
    </div>
  );
}

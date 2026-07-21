"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Crown, Download, Lock, PartyPopper, Share2, X } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { generateTopEarnerFlyer, shareFlyer, downloadFlyer } from "@/lib/flyer-canvas";

const UNLOCK_RANK = 15;

interface MyReferralRank {
  rank: number | null;
  referralCount: number;
}

export function TopEarnerFab({ fullName, lifetimeEarnings }: { fullName: string; lifetimeEarnings: number }) {
  const [open, setOpen] = useState(false);
  const [myRank, setMyRank] = useState<MyReferralRank | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open || myRank) return;
    apiFetch<{ myReferralRank: MyReferralRank }>("/api/leaderboard")
      .then((res) => setMyRank(res.myReferralRank))
      .catch(() => {});
  }, [open, myRank]);

  const unlocked = Boolean(myRank?.rank && myRank.rank <= UNLOCK_RANK);

  async function withFlyer(action: (blob: Blob) => void | Promise<void>) {
    if (!myRank?.rank) return;
    setGenerating(true);
    try {
      const blob = await generateTopEarnerFlyer({ fullName, rank: myRank.rank, totalEarned: lifetimeEarnings });
      await action(blob);
    } catch {
      toast.error("Could not generate your flyer - please try again");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30">
        <div className="pointer-events-none relative mx-auto max-w-md">
          <button
            onClick={() => setOpen(true)}
            aria-label="Top Earner Club"
            className="pointer-events-auto absolute right-4 flex h-14 w-14 items-center justify-center rounded-full gradient-brand text-white shadow-lg shadow-brand-primary/30 transition-transform active:scale-95"
          >
            <Crown className="h-6 w-6" />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="gradient-plan-dark relative w-full max-w-sm overflow-hidden rounded-3xl border-2 border-brand-amber/50 p-6 text-center text-white shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-brand-amber/50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-amber">
              <Lock className="h-3 w-3" /> Top Earner Club <Lock className="h-3 w-3" />
            </span>

            <div className="relative mx-auto mt-5 flex h-24 w-24 items-center justify-center rounded-full border-2 border-brand-amber/60 bg-white/10">
              <Crown className="absolute -top-3 h-6 w-6 text-brand-amber" />
              {unlocked ? <PartyPopper className="h-9 w-9 text-brand-amber" /> : <Lock className="h-9 w-9 text-white/80" />}
            </div>

            <h2 className="mt-4 text-xl font-extrabold">Become a Top Earner</h2>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-white/50">
              {unlocked ? "Special design unlocked" : "Special design locked"}
            </p>

            <p className="mt-3 text-sm text-white/70">
              {unlocked
                ? `You're #${myRank?.rank} on the referral leaderboard — you've unlocked a premium gold flyer made just for you, with your name and your total.`
                : `Reach the Top ${UNLOCK_RANK} and unlock a premium gold flyer made just for you, with your name and your total.`}
            </p>

            {unlocked ? (
              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => withFlyer(shareFlyer)}
                  disabled={generating}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-amber text-sm font-bold text-[#3a2c00] disabled:opacity-60"
                >
                  {generating ? (
                    "Generating…"
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" /> Share your flyer
                    </>
                  )}
                </button>
                <button
                  onClick={() => withFlyer(downloadFlyer)}
                  disabled={generating}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-brand-amber/40 text-xs font-semibold text-brand-amber disabled:opacity-60"
                >
                  <Download className="h-3.5 w-3.5" /> Or download the image
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-brand-amber/40 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Your special flyer</p>
                <p className="font-bold text-brand-amber/80">Locked</p>
              </div>
            )}

            {myRank && (
              <p className="mt-3 text-xs text-white/50">
                {myRank.rank
                  ? `You're currently #${myRank.rank} with ${myRank.referralCount} referral${myRank.referralCount === 1 ? "" : "s"}`
                  : "Refer your first friend to join the leaderboard"}
              </p>
            )}

            {!unlocked && <p className="mt-1 text-xs text-white/50">Refer more people to climb the leaderboard</p>}

            <p className="mt-5 text-xs text-white/40">
              <span className="font-bold text-white/70">SureCash Mining</span> · your voice is currency
            </p>
          </div>
        </div>
      )}
    </>
  );
}

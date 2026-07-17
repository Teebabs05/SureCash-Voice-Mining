"use client";

import { useEffect, useState } from "react";
import { Copy, Users, CheckCircle2, Clock, Network, Share2, MessageCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

interface ReferralData {
  referralCode: string;
  referralUrl: string;
  totalReferrals: number;
  totalEarned: number;
  referrals: Array<{
    id: string;
    rewardAmount: string;
    rewardCredited: boolean;
    referred: { fullName: string; emailVerified: boolean; createdAt: string };
  }>;
  network: Array<{ level: number; count: number; verifiedCount: number }>;
  networkSize: number;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  referralCommission: string;
}

function shareMessage(referralUrl: string) {
  return `Join SureCash Mining and start earning with your voice, daily mining, and tasks! Sign up with my link: ${referralUrl}`;
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    apiFetch<ReferralData>("/api/referrals").then(setData);
    apiFetch<{ plans: Plan[] }>("/api/plans").then((res) => setPlans(res.plans));
  }, []);

  function copyLink() {
    if (!data) return;
    navigator.clipboard.writeText(data.referralUrl);
    toast.success("Referral link copied");
  }

  async function share() {
    if (!data) return;
    const text = shareMessage(data.referralUrl);
    if (navigator.share) {
      try {
        await navigator.share({ title: "SureCash Mining", text, url: data.referralUrl });
      } catch {
        // User cancelled the share sheet - nothing to do.
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Message copied - paste it anywhere to share");
    }
  }

  function shareToWhatsApp() {
    if (!data) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage(data.referralUrl))}`, "_blank");
  }

  if (!data) return <p className="py-10 text-center text-sm text-foreground/50">Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Affiliate Program</h1>
        <p className="text-sm text-foreground/60">Earn a bonus for every friend who joins and verifies their email.</p>
      </div>

      <div className="card gradient-wallet-referral p-5 text-white">
        <p className="text-xs text-white/75">Your referral code</p>
        <p className="text-2xl font-bold tracking-widest">{data.referralCode}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your referral link</CardTitle>
        </CardHeader>
        <div className="flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2.5 text-sm">
          <p className="flex-1 truncate text-foreground/70">{data.referralUrl}</p>
          <Button size="sm" onClick={copyLink}>
            <Copy className="h-3.5 w-3.5" /> Copy
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={share}>
            <Share2 className="h-4 w-4" /> Share
          </Button>
          <Button variant="outline" onClick={shareToWhatsApp}>
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <Users className="mx-auto h-5 w-5 text-brand-primary" />
          <p className="mt-1 text-lg font-bold">{data.totalReferrals}</p>
          <p className="text-xs text-foreground/50">Total invites</p>
        </Card>
        <Card className="text-center">
          <p className="mt-1 text-lg font-bold text-brand-green">{formatCurrency(data.totalEarned)}</p>
          <p className="text-xs text-foreground/50">Total earned</p>
        </Card>
      </div>

      <Card className="bg-brand-primary/5">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-primary">
          <Info className="h-4 w-4" /> How your commission is calculated
        </p>
        <p className="mt-1.5 text-sm text-foreground/70">
          You earn a commission based on the plan your referral activates - the bigger the plan they buy, the more
          you earn.
        </p>
      </Card>

      {plans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Commission per plan activated</CardTitle>
          </CardHeader>
          <div className="flex flex-col divide-y divide-border">
            {plans.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <span>
                  {p.name} <span className="text-foreground/50">({formatCurrency(p.price)})</span>
                </span>
                <span className="font-semibold text-brand-green">{formatCurrency(p.referralCommission)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Network className="h-4 w-4" /> Your network
            </span>
          </CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-foreground/50">
          Only your direct invites (level 1) earn you commission — deeper levels are shown for visibility into your
          network&apos;s growth.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {data.network.map((l) => (
            <div key={l.level} className="rounded-xl bg-surface-muted p-3 text-center">
              <p className="text-lg font-bold">{l.count}</p>
              <p className="text-xs text-foreground/50">Level {l.level}</p>
              <p className="text-[10px] text-foreground/40">{l.verifiedCount} verified</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-foreground/50">
          Total network: <span className="font-semibold text-foreground/70">{data.networkSize}</span> people
        </p>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your invites</CardTitle>
        </CardHeader>
        <div className="flex flex-col divide-y divide-border">
          {data.referrals.length === 0 && (
            <p className="py-6 text-center text-sm text-foreground/50">No invites yet — share your link!</p>
          )}
          {data.referrals.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">{r.referred.fullName}</p>
                <p className="text-xs text-foreground/50">
                  Joined {new Date(r.referred.createdAt).toLocaleDateString()}
                </p>
              </div>
              {r.rewardCredited ? (
                <span className="flex items-center gap-1 text-xs font-medium text-brand-green">
                  <CheckCircle2 className="h-4 w-4" /> +{formatCurrency(r.rewardAmount)}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-foreground/40">
                  <Clock className="h-4 w-4" /> Pending
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

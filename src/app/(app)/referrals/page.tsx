"use client";

import { useEffect, useState } from "react";
import { Copy, Users, CheckCircle2, Clock } from "lucide-react";
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
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);

  useEffect(() => {
    apiFetch<ReferralData>("/api/referrals").then(setData);
  }, []);

  function copyLink() {
    if (!data) return;
    navigator.clipboard.writeText(data.referralUrl);
    toast.success("Referral link copied");
  }

  if (!data) return <p className="py-10 text-center text-sm text-foreground/50">Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Invite Friends</h1>
        <p className="text-sm text-foreground/60">Earn a bonus for every friend who joins and verifies their email.</p>
      </div>

      <div className="card gradient-wallet-referral p-5 text-white">
        <p className="text-xs text-white/75">Your referral code</p>
        <p className="text-2xl font-bold tracking-widest">{data.referralCode}</p>
        <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={copyLink}>
          <Copy className="h-4 w-4" /> Copy invite link
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <Users className="mx-auto h-5 w-5 text-brand-purple" />
          <p className="mt-1 text-lg font-bold">{data.totalReferrals}</p>
          <p className="text-xs text-foreground/50">Total invites</p>
        </Card>
        <Card className="text-center">
          <p className="mt-1 text-lg font-bold text-brand-green">{formatCurrency(data.totalEarned)}</p>
          <p className="text-xs text-foreground/50">Total earned</p>
        </Card>
      </div>

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

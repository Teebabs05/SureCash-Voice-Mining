"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, ShieldCheck, Bell, ChevronRight, Mail, BadgeCheck, MessageCircle, Rss, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";

interface Me {
  user: {
    fullName: string;
    email: string;
    level: number;
    emailVerified: boolean;
    referralCode: string;
    tier: string;
  };
}

interface SocialAccounts {
  facebookUrl: string | null;
  instagramHandle: string | null;
  tiktokHandle: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me["user"] | null>(null);
  const [hasBankAccount, setHasBankAccount] = useState(false);
  const [linkedSocialCount, setLinkedSocialCount] = useState(0);

  useEffect(() => {
    apiFetch<Me>("/api/auth/me").then((res) => setMe(res.user));
    apiFetch<{ accounts: unknown[] }>("/api/bank-accounts").then((res) => setHasBankAccount(res.accounts.length > 0));
    apiFetch<{ socialAccounts: SocialAccounts }>("/api/profile/social-accounts").then((res) => {
      const { facebookUrl, instagramHandle, tiktokHandle } = res.socialAccounts;
      setLinkedSocialCount([facebookUrl, instagramHandle, tiktokHandle].filter(Boolean).length);
    });
  }, []);

  async function resendVerification() {
    try {
      await apiFetch("/api/auth/resend-verification", { method: "POST" });
      toast.success("Verification email sent");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send email");
    }
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (!me) return <p className="py-10 text-center text-sm text-foreground/50">Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="card flex items-center gap-4 p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full gradient-brand text-lg font-bold text-white">
          {me.fullName.slice(0, 1)}
        </div>
        <div>
          <p className="font-semibold">{me.fullName}</p>
          <p className="text-xs text-foreground/50">{me.email}</p>
          <span className="mt-1 mr-1 inline-block rounded-full bg-brand-purple/10 px-2 py-0.5 text-[10px] font-semibold text-brand-purple">
            Level {me.level}
          </span>
          <span className="mt-1 inline-block rounded-full bg-brand-gold/15 px-2 py-0.5 text-[10px] font-semibold text-[#a67c00]">
            {me.tier} tier
          </span>
        </div>
      </div>

      {!me.emailVerified && (
        <Card className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-brand-gold" /> Email not verified
          </div>
          <Button size="sm" variant="outline" onClick={resendVerification}>
            Resend
          </Button>
        </Card>
      )}

      {(() => {
        const steps = [me.emailVerified, hasBankAccount, linkedSocialCount >= 2];
        const done = steps.filter(Boolean).length;
        if (done === steps.length) return null;
        return (
          <Card>
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Finish setting up</span>
              <span className="text-brand-purple">
                {done}/{steps.length}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full gradient-brand transition-all"
                style={{ width: `${(done / steps.length) * 100}%` }}
              />
            </div>
          </Card>
        );
      })()}

      <div className="flex flex-col divide-y divide-border card p-0">
        <Link href="/profile/security" className="flex items-center justify-between p-4">
          <span className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="h-4 w-4 text-foreground/50" /> Security & bank accounts
          </span>
          <span className="flex items-center gap-2">
            {hasBankAccount && (
              <span className="rounded-full bg-brand-green/15 px-2 py-0.5 text-[10px] font-semibold text-brand-green">
                Added
              </span>
            )}
            <ChevronRight className="h-4 w-4 text-foreground/30" />
          </span>
        </Link>
        <Link href="/profile/social-accounts" className="flex items-center justify-between p-4">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Share2 className="h-4 w-4 text-foreground/50" /> Social Accounts
          </span>
          <span className="flex items-center gap-2">
            <span
              className={
                linkedSocialCount > 0
                  ? "rounded-full bg-brand-green/15 px-2 py-0.5 text-[10px] font-semibold text-brand-green"
                  : "rounded-full bg-brand-gold/15 px-2 py-0.5 text-[10px] font-semibold text-[#a67c00]"
              }
            >
              {linkedSocialCount > 0 ? `${linkedSocialCount} linked` : "Add"}
            </span>
            <ChevronRight className="h-4 w-4 text-foreground/30" />
          </span>
        </Link>
        <Link href="/profile/notifications" className="flex items-center justify-between p-4">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Bell className="h-4 w-4 text-foreground/50" /> Notifications
          </span>
          <ChevronRight className="h-4 w-4 text-foreground/30" />
        </Link>
        <Link href="/support" className="flex items-center justify-between p-4">
          <span className="flex items-center gap-2 text-sm font-medium">
            <MessageCircle className="h-4 w-4 text-foreground/50" /> Support & FAQ
          </span>
          <ChevronRight className="h-4 w-4 text-foreground/30" />
        </Link>
        <Link href="/feed" className="flex items-center justify-between p-4">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Rss className="h-4 w-4 text-foreground/50" /> Community Feed
          </span>
          <ChevronRight className="h-4 w-4 text-foreground/30" />
        </Link>
        <Link href="/achievements" className="flex items-center justify-between p-4">
          <span className="flex items-center gap-2 text-sm font-medium">
            <BadgeCheck className="h-4 w-4 text-foreground/50" /> Achievements
          </span>
          <ChevronRight className="h-4 w-4 text-foreground/30" />
        </Link>
      </div>

      <Button variant="danger" onClick={logout}>
        <LogOut className="h-4 w-4" /> Log out
      </Button>
    </div>
  );
}

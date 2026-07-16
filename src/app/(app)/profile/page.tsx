"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LogOut,
  ShieldCheck,
  Bell,
  ChevronRight,
  User as UserIcon,
  Landmark,
  Share2,
  Receipt,
  MessageCircle,
  Rss,
  BadgeCheck,
  Camera,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api-client";

interface Me {
  user: {
    fullName: string;
    email: string;
    level: number;
    emailVerified: boolean;
    referralCode: string;
    tier: string;
    avatarUrl: string | null;
    planName: string | null;
  };
}

interface SocialAccounts {
  facebookUrl: string | null;
  instagramHandle: string | null;
  tiktokHandle: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [me, setMe] = useState<Me["user"] | null>(null);
  const [hasBankAccount, setHasBankAccount] = useState(false);
  const [linkedSocialCount, setLinkedSocialCount] = useState(0);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  function load() {
    apiFetch<Me>("/api/auth/me").then((res) => setMe(res.user));
  }

  useEffect(() => {
    load();
    apiFetch<{ accounts: unknown[] }>("/api/bank-accounts").then((res) => setHasBankAccount(res.accounts.length > 0));
    apiFetch<{ socialAccounts: SocialAccounts }>("/api/profile/social-accounts").then((res) => {
      const { facebookUrl, instagramHandle, tiktokHandle } = res.socialAccounts;
      setLinkedSocialCount([facebookUrl, instagramHandle, tiktokHandle].filter(Boolean).length);
    });
  }, []);

  async function uploadAvatar(file: File) {
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append("avatar", file);
      await apiFetch("/api/profile/avatar", { method: "POST", body: form, headers: {} });
      toast.success("Profile photo updated");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not upload photo");
    } finally {
      setUploadingAvatar(false);
    }
  }

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

  const membershipLabel = me.planName ? `${me.planName} Member` : "Free Member";
  const handle = me.fullName.trim().split(/\s+/)[0]?.toLowerCase() ?? me.referralCode.toLowerCase();

  return (
    <div className="flex flex-col gap-4">
      <div className="profile-banner relative overflow-hidden rounded-3xl px-6 pb-6 pt-8 text-center">
        <div className="relative mx-auto h-24 w-24">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full gradient-brand text-2xl font-bold text-white ring-4 ring-white/15">
            {me.avatarUrl ? (
              <Image src={me.avatarUrl} alt={me.fullName} width={96} height={96} className="h-full w-full object-cover" />
            ) : (
              me.fullName.slice(0, 1).toUpperCase()
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white text-foreground shadow-md"
          >
            <Camera className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadAvatar(file);
              e.target.value = "";
            }}
          />
        </div>

        <p className="mt-4 text-lg font-bold text-white">{me.fullName}</p>
        <p className="text-sm text-white/60">@{handle}</p>

        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-[#10201d]">
          <Crown className="h-3.5 w-3.5 text-brand-amber" /> {membershipLabel}
        </span>
      </div>

      {!me.emailVerified && (
        <div className="card flex items-center justify-between p-4">
          <span className="text-sm text-foreground/70">Verify your email to unlock full access.</span>
          <button onClick={resendVerification} className="text-sm font-semibold text-brand-primary">
            Resend
          </button>
        </div>
      )}

      {(() => {
        const steps = [me.emailVerified, hasBankAccount, linkedSocialCount >= 2];
        const done = steps.filter(Boolean).length;
        if (done === steps.length) return null;
        return (
          <div className="card p-4">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Finish setting up</span>
              <span className="text-brand-primary">
                {done}/{steps.length}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full gradient-brand transition-all"
                style={{ width: `${(done / steps.length) * 100}%` }}
              />
            </div>
          </div>
        );
      })()}

      <div className="flex flex-col gap-3">
        <Link href="/profile/personal-info" className="card flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
              <UserIcon className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Personal Info</p>
              <p className="text-xs text-foreground/50">Name, phone, email</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-foreground/30" />
        </Link>

        <Link href="/profile/bank-account" className="card flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
              <Landmark className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Bank Account</p>
              <p className="text-xs text-foreground/50">Payout destination</p>
            </div>
          </div>
          <span
            className={
              hasBankAccount
                ? "rounded-full bg-brand-green/15 px-2.5 py-1 text-[10px] font-bold text-brand-green"
                : "rounded-full bg-brand-amber/15 px-2.5 py-1 text-[10px] font-bold text-[#a67c00]"
            }
          >
            {hasBankAccount ? "Added" : "Add"}
          </span>
        </Link>

        <Link href="/profile/social-accounts" className="card flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
              <Share2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Social Accounts</p>
              <p className="text-xs text-foreground/50">For sponsored post tasks</p>
            </div>
          </div>
          <span
            className={
              linkedSocialCount > 0
                ? "rounded-full bg-brand-green/15 px-2.5 py-1 text-[10px] font-bold text-brand-green"
                : "rounded-full bg-brand-amber/15 px-2.5 py-1 text-[10px] font-bold text-[#a67c00]"
            }
          >
            {linkedSocialCount > 0 ? `${linkedSocialCount} linked` : "Add"}
          </span>
        </Link>

        <Link href="/profile/security" className="card flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Password &amp; Security</p>
              <p className="text-xs text-foreground/50">Change your password</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-foreground/30" />
        </Link>

        <Link href="/profile/transactions" className="card flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
              <Receipt className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Transaction History</p>
              <p className="text-xs text-foreground/50">All your earnings &amp; payouts</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-foreground/30" />
        </Link>

        <Link href="/support" className="card flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
              <MessageCircle className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Help &amp; Support</p>
              <p className="text-xs text-foreground/50">Contact us</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-foreground/30" />
        </Link>

        <Link href="/feed" className="card flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
              <Rss className="h-4.5 w-4.5" />
            </div>
            <p className="text-sm font-semibold">Community Feed</p>
          </div>
          <ChevronRight className="h-4 w-4 text-foreground/30" />
        </Link>

        <Link href="/achievements" className="card flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
              <BadgeCheck className="h-4.5 w-4.5" />
            </div>
            <p className="text-sm font-semibold">Achievements</p>
          </div>
          <ChevronRight className="h-4 w-4 text-foreground/30" />
        </Link>

        <Link href="/profile/notifications" className="card flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
              <Bell className="h-4.5 w-4.5" />
            </div>
            <p className="text-sm font-semibold">Notifications</p>
          </div>
          <ChevronRight className="h-4 w-4 text-foreground/30" />
        </Link>

        <button onClick={logout} className="card flex items-center gap-3 p-4 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <LogOut className="h-4.5 w-4.5" />
          </div>
          <p className="text-sm font-semibold text-red-500">Log Out</p>
        </button>
      </div>
    </div>
  );
}

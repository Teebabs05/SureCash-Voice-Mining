"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Mic, Pickaxe, Target, Gift, Users, Wallet as WalletIcon, Flame, ChevronRight, Smartphone, Wifi, Zap, Tv, Banknote } from "lucide-react";
import { WalletCarousel, type WalletCardData } from "@/components/wallet/wallet-carousel";
import { MissionsCard } from "@/components/dashboard/missions-card";
import { ActivityTicker } from "@/components/dashboard/activity-ticker";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

interface DashboardData {
  user: {
    fullName: string;
    level: number;
    levelTitle: string;
    xp: number;
    streakCount: number;
    emailVerified: boolean;
  };
  wallets: WalletCardData[];
  totalBalance: number;
  earnings: { today: number; week: number; month: number; lifetime: number; pending: number };
  levelProgress: { percent: number; nextLevelTitle: string | null; nextLevelBonus: number | null };
}

const BILL_PAYMENTS = [
  { label: "Airtime", icon: Smartphone, iconClass: "bg-brand-primary/15 text-brand-primary" },
  { label: "Data", icon: Wifi, iconClass: "bg-brand-green/15 text-brand-green" },
  { label: "Electricity", icon: Zap, iconClass: "bg-brand-amber/15 text-[#a67c00]" },
  { label: "TV", icon: Tv, iconClass: "bg-red-500/15 text-red-500" },
  { label: "Airtime to Cash", icon: Banknote, iconClass: "bg-blue-500/15 text-blue-500" },
];

const QUICK_ACTIONS = [
  { href: "/voice", label: "Voice Tasks", icon: Mic, gradient: "gradient-wallet-voice" },
  { href: "/mine", label: "Start Mining", icon: Pickaxe, gradient: "gradient-wallet-mining" },
  { href: "/tasks", label: "Task Center", icon: Target, gradient: "gradient-wallet-task" },
  { href: "/spin", label: "Lucky Spin", icon: Gift, gradient: "gradient-wallet-bonus" },
  { href: "/referrals", label: "Invite Friends", icon: Users, gradient: "gradient-wallet-referral" },
  { href: "/wallet/withdraw", label: "Withdraw", icon: WalletIcon, gradient: "gradient-wallet-main" },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    apiFetch<DashboardData>("/api/dashboard").then(setData);
  }, []);

  if (!data) return <p className="py-10 text-center text-sm text-foreground/50">Loading dashboard…</p>;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm text-foreground/60">
          {greeting()}, {data.user.fullName.split(" ")[0]}
        </p>
        {!data.user.emailVerified && (
          <p className="mt-1 rounded-lg bg-brand-amber/15 px-3 py-1.5 text-xs font-medium text-[#a67c00]">
            Verify your email to unlock mining, voice tasks & withdrawals.
          </p>
        )}
      </div>

      <ActivityTicker />

      <WalletCarousel wallets={data.wallets} />

      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
        {BILL_PAYMENTS.map(({ label, icon: Icon, iconClass }) => (
          <button
            key={label}
            onClick={() => toast("Coming soon", { description: `${label} payments aren't available yet.` })}
            className="flex flex-none flex-col items-center gap-1.5"
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${iconClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-foreground/70">{label}</span>
          </button>
        ))}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground/70">Quick actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon, gradient }) => (
            <Link
              key={href}
              href={href}
              className="card flex flex-col items-center gap-2 py-4 text-center transition-transform active:scale-95"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-full ${gradient} text-white`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earnings summary</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-foreground/50">Today</p>
            <p className="text-lg font-bold text-brand-green">{formatCurrency(data.earnings.today)}</p>
          </div>
          <div>
            <p className="text-xs text-foreground/50">This week</p>
            <p className="text-lg font-bold">{formatCurrency(data.earnings.week)}</p>
          </div>
          <div>
            <p className="text-xs text-foreground/50">This month</p>
            <p className="text-lg font-bold">{formatCurrency(data.earnings.month)}</p>
          </div>
          <div>
            <p className="text-xs text-foreground/50">Lifetime</p>
            <p className="text-lg font-bold">{formatCurrency(data.earnings.lifetime)}</p>
          </div>
        </div>
        {data.earnings.pending > 0 && (
          <p className="mt-3 rounded-lg bg-surface-muted px-3 py-2 text-xs text-foreground/60">
            {formatCurrency(data.earnings.pending)} pending review
          </p>
        )}
      </Card>

      <Card className="gradient-brand text-white">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">LEVEL {data.user.level}</span>
          <span className="text-xs text-white/70">{data.user.levelTitle}</span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/20">
          <div className="h-full bg-brand-amber" style={{ width: `${data.levelProgress.percent}%` }} />
        </div>
        {data.levelProgress.nextLevelTitle && (
          <p className="mt-2 text-xs text-white/80">
            {data.levelProgress.percent}% to {data.levelProgress.nextLevelTitle}
            {data.levelProgress.nextLevelBonus ? ` · +${formatCurrency(data.levelProgress.nextLevelBonus)} bonus` : ""}
          </p>
        )}
      </Card>

      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-500/15 text-orange-500">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">{data.user.streakCount}-day streak</p>
            <p className="text-xs text-foreground/50">Mine daily to keep it going</p>
          </div>
        </div>
        <Link href="/mine" className="text-brand-primary">
          <ChevronRight className="h-5 w-5" />
        </Link>
      </Card>

      <MissionsCard />

      <div className="grid grid-cols-2 gap-3">
        <Link href="/achievements" className="card flex items-center justify-between p-4">
          <span className="text-sm font-medium">Achievements</span>
          <ChevronRight className="h-4 w-4 text-foreground/40" />
        </Link>
        <Link href="/leaderboard" className="card flex items-center justify-between p-4">
          <span className="text-sm font-medium">Leaderboard</span>
          <ChevronRight className="h-4 w-4 text-foreground/40" />
        </Link>
      </div>
    </div>
  );
}

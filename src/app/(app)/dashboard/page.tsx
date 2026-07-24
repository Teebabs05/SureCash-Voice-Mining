"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Mic,
  Pickaxe,
  Gift,
  Users,
  Wallet as WalletIcon,
  Flame,
  ChevronRight,
  Smartphone,
  Wifi,
  Zap,
  Tv,
  MailWarning,
  Megaphone,
  Share2,
  Copy,
  Crown,
  Rocket,
  Monitor,
  Trophy,
  ArrowRight,
  Gamepad2,
  Flag,
  CheckSquare,
  ArrowUpRight,
  PartyPopper,
} from "lucide-react";
import { WalletCarousel, type WalletCardData } from "@/components/wallet/wallet-carousel";
import { BillPaymentsArc } from "@/components/dashboard/bill-payments-arc";
import { TopEarnerFab } from "@/components/dashboard/top-earner-fab";
import { MissionsCard } from "@/components/dashboard/missions-card";
import { ActivityTicker } from "@/components/dashboard/activity-ticker";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

interface SetupStep {
  key: string;
  label: string;
  done: boolean;
  href: string;
}

interface DashboardData {
  user: {
    fullName: string;
    handle: string;
    avatarUrl: string | null;
    level: number;
    levelTitle: string;
    xp: number;
    streakCount: number;
    emailVerified: boolean;
  };
  plan: { name: string; voiceSessionReward: number; wordGameReward: number; taskReward: number } | null;
  planRequired: boolean;
  wallets: WalletCardData[];
  totalBalance: number;
  earnings: { today: number; week: number; month: number; lifetime: number; pending: number };
  withdrawnLifetime: number;
  activitiesToday: number;
  levelProgress: { percent: number; nextLevelTitle: string | null; nextLevelBonus: number | null };
  setupSteps: SetupStep[];
  announcement: string | null;
}

interface VoiceTaskLite {
  completedToday: number;
  dailyLimit: number;
}

interface TaskCenterTaskLite {
  isCompleted: boolean;
}

interface ReferralData {
  referralUrl: string;
  totalReferrals: number;
  activatedReferrals: number;
  pendingReferrals: number;
}

const BILL_PAYMENTS = [
  {
    label: "Airtime",
    icon: Smartphone,
    iconClass: "bg-brand-primary/15 text-brand-primary",
    color: "primary" as const,
    description: "Buy airtime straight from your SureCash wallet. We're putting the finishing touches on it. Stay tuned.",
    raised: true,
  },
  {
    label: "Data",
    icon: Wifi,
    iconClass: "bg-brand-green/15 text-brand-green",
    color: "green" as const,
    description: "Buy data bundles straight from your SureCash wallet. We're putting the finishing touches on it. Stay tuned.",
    raised: false,
  },
  {
    label: "Electricity",
    icon: Zap,
    iconClass: "bg-brand-amber/15 text-[#a67c00]",
    color: "amber" as const,
    description: "Pay electricity bills straight from your SureCash wallet. We're putting the finishing touches on it. Stay tuned.",
    raised: false,
  },
  {
    label: "TV",
    icon: Tv,
    iconClass: "bg-red-500/15 text-red-500",
    color: "red" as const,
    description: "Renew TV subscriptions straight from your SureCash wallet. We're putting the finishing touches on it. Stay tuned.",
    raised: true,
  },
];

const QUICK_ACTIONS = [
  { href: "/mine", label: "Start Mining", icon: Pickaxe, gradient: "gradient-wallet-mining" },
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

function CircularProgress({ percent }: { percent: number }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  return (
    <svg viewBox="0 0 48 48" className="h-11 w-11 flex-none -rotate-90">
      <circle cx="24" cy="24" r={radius} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
      <circle
        cx="24"
        cy="24"
        r={radius}
        fill="none"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<DashboardData | null>(null);
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<"ready" | "cooldown" | "limit_reached" | null>(null);
  const [wordGameStatus, setWordGameStatus] = useState<"ready" | "cooldown" | "limit_reached" | null>(null);
  const [tasksStatus, setTasksStatus] = useState<"ready" | "done" | "limit_reached" | null>(null);
  const [sponsoredStatus, setSponsoredStatus] = useState<"ready" | "done" | "limit_reached" | null>(null);
  const [sponsoredRate, setSponsoredRate] = useState(50);
  const [resending, setResending] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<DashboardData>("/api/dashboard").then(setData);
    apiFetch<ReferralData>("/api/referrals").then(setReferral).catch(() => {});
    apiFetch<{ languages: { limitReached: boolean }[] }>("/api/voice/tasks?category=session")
      .then((res) =>
        setVoiceStatus(res.languages.every((l) => l.limitReached) ? "limit_reached" : "ready")
      )
      .catch(() => {});
    apiFetch<{ tasks: VoiceTaskLite[]; sectionDailyLimit: number | null; sectionCompletedToday: number }>(
      "/api/voice/tasks?category=word_game"
    )
      .then((res) =>
        setWordGameStatus(
          res.sectionDailyLimit !== null && res.sectionCompletedToday >= res.sectionDailyLimit
            ? "limit_reached"
            : res.tasks.length === 0
              ? null
              : res.tasks.some((t) => t.completedToday < t.dailyLimit)
                ? "ready"
                : "cooldown"
        )
      )
      .catch(() => {});
    apiFetch<{ tasks: TaskCenterTaskLite[]; sectionDailyLimit: number | null; sectionCompletedToday: number }>(
      "/api/tasks"
    )
      .then((res) =>
        setTasksStatus(
          res.sectionDailyLimit !== null && res.sectionCompletedToday >= res.sectionDailyLimit
            ? "limit_reached"
            : res.tasks.length === 0
              ? null
              : res.tasks.some((t) => !t.isCompleted)
                ? "ready"
                : "done"
        )
      )
      .catch(() => {});
    apiFetch<{
      platforms: { status: string }[];
      rewardAmount: number;
      sectionDailyLimit: number | null;
      sectionCompletedToday: number;
    }>("/api/sponsored-posts")
      .then((res) => {
        setSponsoredRate(res.rewardAmount);
        setSponsoredStatus(
          res.sectionDailyLimit !== null && res.sectionCompletedToday >= res.sectionDailyLimit
            ? "limit_reached"
            : res.platforms.some((p) => p.status === "AVAILABLE")
              ? "ready"
              : "done"
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const reference = searchParams.get("deposit");
    if (!reference) return;

    let cancelled = false;

    function checkDeposit(retriesLeft: number) {
      apiFetch<{ status: "success" | "pending" | "failed"; amount?: number }>(`/api/deposits/${reference}/confirm`)
        .then((res) => {
          if (cancelled) return;
          if (res.status === "success") {
            setDepositSuccess(res.amount ?? 0);
            apiFetch<DashboardData>("/api/dashboard").then(setData).catch(() => {});
          } else if (res.status === "pending" && retriesLeft > 0) {
            setTimeout(() => checkDeposit(retriesLeft - 1), 3000);
            return;
          } else if (res.status === "failed") {
            toast.error("We couldn't confirm that payment - if you were charged, it'll still be credited shortly.");
          }
          router.replace("/dashboard");
        })
        .catch(() => {
          if (!cancelled) router.replace("/dashboard");
        });
    }

    checkDeposit(2);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run if the ?deposit= param itself changes
  }, [searchParams]);

  async function resendVerification() {
    setResending(true);
    try {
      await apiFetch("/api/auth/resend-verification", { method: "POST" });
      toast.success("Verification email sent - check your inbox");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send email");
    } finally {
      setResending(false);
    }
  }

  function copyReferralLink() {
    if (!referral) return;
    navigator.clipboard.writeText(referral.referralUrl);
    toast.success("Referral link copied");
  }

  if (!data) return <p className="py-10 text-center text-sm text-foreground/50">Loading dashboard…</p>;

  const nextStep = data.setupSteps.find((s) => !s.done);
  const doneSteps = data.setupSteps.filter((s) => s.done).length;

  // Voice Earn and Word Game are fully locked without a plan; Tasks and
  // Sponsored Posts stay browsable for free (just paying nothing) so they
  // keep showing their real ready/done status instead of "locked".
  function earnNowStatus(key: "voice" | "wordgame" | "tasks" | "sponsored", activityStatus: "ready" | "cooldown" | "done" | "limit_reached" | null) {
    if (data!.planRequired && (key === "voice" || key === "wordgame")) return "locked";
    return activityStatus;
  }

  const earnNow = [
    {
      key: "voice",
      href: "/voice",
      label: "Voice Earn",
      icon: Mic,
      rate: data.planRequired
        ? `+${formatCurrency(0)}/session`
        : data.plan
          ? `+${formatCurrency(data.plan.voiceSessionReward)}/session`
          : "Base rate",
      status: earnNowStatus("voice", voiceStatus),
    },
    {
      key: "wordgame",
      href: "/word-game",
      label: "Word Game",
      icon: Gamepad2,
      rate: data.planRequired
        ? `+${formatCurrency(0)}/word`
        : data.plan
          ? `+${formatCurrency(data.plan.wordGameReward)}/word`
          : "Base rate",
      status: earnNowStatus("wordgame", wordGameStatus),
    },
    {
      key: "tasks",
      href: "/tasks",
      label: "Tasks",
      icon: CheckSquare,
      rate: data.planRequired
        ? `+${formatCurrency(0)}/task`
        : data.plan
          ? `+${formatCurrency(data.plan.taskReward)}/task`
          : "Base rate",
      status: earnNowStatus("tasks", tasksStatus),
    },
    {
      key: "sponsored",
      href: "/tasks/sponsored",
      label: "Sponsored",
      icon: Flag,
      rate: data.planRequired ? `+${formatCurrency(0)}/post` : `+${formatCurrency(sponsoredRate)}/post`,
      status: earnNowStatus("sponsored", sponsoredStatus),
    },
  ] as const;

  return (
    <div className="flex flex-col gap-5">
      {data.announcement && (
        <div className="flex items-start gap-2 rounded-xl bg-brand-primary/10 px-3 py-2.5 text-sm text-brand-primary">
          <Megaphone className="mt-0.5 h-4 w-4 flex-none" />
          <p>{data.announcement}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        {data.user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded avatar
          <img src={data.user.avatarUrl} alt="" className="h-11 w-11 flex-none rounded-full object-cover" />
        ) : (
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full gradient-brand text-sm font-bold text-white">
            {data.user.fullName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm text-foreground/60">{greeting()}</p>
          <p className="text-base font-bold">{data.user.fullName.split(" ")[0]}</p>
        </div>
      </div>

      {!data.user.emailVerified && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand-amber/15 px-4 py-3">
          <div className="flex items-center gap-2">
            <MailWarning className="h-4 w-4 flex-none text-[#a67c00]" />
            <p className="text-xs font-medium text-[#a67c00]">
              Verify your email to unlock mining, voice tasks &amp; withdrawals.
            </p>
          </div>
          <Button size="sm" variant="secondary" loading={resending} onClick={resendVerification} className="flex-none">
            Resend
          </Button>
        </div>
      )}

      <ActivityTicker />

      <WalletCarousel wallets={data.wallets} />

      <BillPaymentsArc items={BILL_PAYMENTS} />

      {nextStep && (
        <Link href={nextStep.href}>
          <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl gradient-brand p-4 text-white shadow-lg">
            <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10 blur-md" />
            <CircularProgress percent={(doneSteps / data.setupSteps.length) * 100} />
            <div className="relative flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">Next step to start earning</p>
              <p className="text-sm font-bold">{nextStep.label}</p>
            </div>
            <div className="relative flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white text-brand-primary">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </Link>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-bold">Overview</h2>
          <Link href="/profile/transactions" className="text-xs font-semibold text-brand-primary">
            All transactions
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Card className="relative overflow-hidden">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-brand-amber/15 text-[#a67c00]">
              <CheckSquare className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold">{data.activitiesToday}</p>
            <p className="text-xs text-foreground/50">Activities today</p>
          </Card>
          <Card className="relative overflow-hidden">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-red-500/15 text-red-500">
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold">{formatCurrency(data.withdrawnLifetime)}</p>
            <p className="text-xs text-foreground/50">Withdrawn · lifetime</p>
          </Card>
        </div>
      </div>

      {referral && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                <Share2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold">Your referral link</p>
                <p className="text-xs text-foreground/50">Earn a commission when friends activate a plan</p>
              </div>
            </div>
            <span className="flex flex-none items-center gap-1 whitespace-nowrap rounded-full bg-brand-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase text-brand-primary">
              <Crown className="h-3 w-3" /> {data.plan ? data.plan.name : "Free Plan"}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2.5 text-sm">
            <p className="flex-1 truncate text-foreground/70">{referral.referralUrl}</p>
            <Button size="sm" onClick={copyReferralLink}>
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold">{referral.totalReferrals}</p>
              <p className="text-xs text-foreground/50">Total</p>
            </div>
            <div>
              <p className="text-lg font-bold text-brand-green">{referral.activatedReferrals}</p>
              <p className="text-xs text-foreground/50">Activated</p>
            </div>
            <div>
              <p className="text-lg font-bold text-brand-amber">{referral.pendingReferrals}</p>
              <p className="text-xs text-foreground/50">Pending</p>
            </div>
          </div>

          <Link
            href="/referrals"
            className="flex h-11 items-center justify-center rounded-xl border border-border text-sm font-semibold"
          >
            View affiliate dashboard
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/earn" className="card flex items-center justify-between p-4">
          <div>
            <div className="mb-2 text-foreground/70">
              <Monitor className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold">Ways to earn</p>
            <p className="text-xs text-foreground/50">6 activities</p>
          </div>
          <ChevronRight className="h-4 w-4 flex-none text-foreground/30" />
        </Link>
        <Link href="/leaderboard" className="card flex items-center justify-between p-4">
          <div>
            <div className="mb-2 text-foreground/70">
              <Trophy className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold">Star earners</p>
            <p className="text-xs text-foreground/50">Top 10 this week</p>
          </div>
          <ChevronRight className="h-4 w-4 flex-none text-foreground/30" />
        </Link>
      </div>

      <Link href="/plans">
        <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl gradient-brand p-4 text-white shadow-lg">
          <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10 blur-md" />
          <div className="relative flex h-10 w-10 flex-none items-center justify-center rounded-full bg-white/15">
            <Rocket className="h-5 w-5" />
          </div>
          <div className="relative flex-1">
            <p className="text-sm font-bold">{data.plan ? "Move to a higher plan" : "Upgrade your account"}</p>
            <p className="text-xs text-white/80">
              {data.plan
                ? "Bigger rewards per session, task & referral - upgrade anytime"
                : "Unlock Voice Earn, Word Game, Tasks & Sponsored Posts with higher rewards"}
            </p>
          </div>
          <ChevronRight className="relative h-4 w-4 flex-none" />
        </div>
      </Link>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-bold">Earn now</h2>
          {data.planRequired && (
            <Link href="/plans" className="text-xs font-semibold text-brand-primary">
              Activate plan
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {earnNow.map(({ key, href, label, icon: Icon, rate, status }) => (
            <Link
              key={key}
              href={status === "locked" || status === "limit_reached" ? "/plans" : href}
              className="card flex flex-col items-center gap-1.5 py-5 text-center"
            >
              <Icon className="h-5 w-5 text-foreground/80" />
              <p className="text-sm font-bold">{label}</p>
              <p className="text-xs font-semibold text-brand-green">{rate}</p>
              <p
                className={`text-xs ${
                  status === "locked" || status === "limit_reached" ? "font-semibold text-brand-amber" : "text-foreground/50"
                }`}
              >
                {status === "ready"
                  ? "Ready"
                  : status === "cooldown"
                    ? "On cooldown"
                    : status === "done"
                      ? "All done"
                      : status === "locked"
                        ? "Activate plan"
                        : status === "limit_reached"
                          ? "Daily limit reached"
                        : " "}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground/70">Quick actions</h2>
        <div className="grid grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon, gradient }) => (
            <Link
              key={href}
              href={href}
              className="card flex flex-col items-center gap-2 px-2 py-4 text-center transition-transform active:scale-95"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${gradient} text-white`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-medium leading-tight">{label}</span>
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

      <TopEarnerFab fullName={data.user.fullName} lifetimeEarnings={data.earnings.lifetime} />

      {depositSuccess !== null && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDepositSuccess(null)} />
          <div className="relative w-full rounded-t-3xl bg-surface px-6 pb-8 pt-3 shadow-xl">
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/15 text-brand-green">
                <PartyPopper className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-lg font-bold">Deposit successful!</h2>
              <p className="mt-1 text-sm text-foreground/60">Your wallet has been credited.</p>
              <p className="mt-3 text-3xl font-extrabold text-brand-green">{formatCurrency(depositSuccess)}</p>

              <Button className="mt-6 w-full" onClick={() => setDepositSuccess(null)}>
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-sm text-foreground/50">Loading dashboard…</p>}>
      <DashboardContent />
    </Suspense>
  );
}

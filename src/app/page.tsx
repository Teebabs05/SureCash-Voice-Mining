import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Mic,
  Pickaxe,
  Target,
  Users,
  Wallet,
  Share2,
  UserPlus,
  ListChecks,
  Banknote,
  ArrowUpRight,
  Smartphone,
  Wifi,
  Zap,
  Tv,
} from "lucide-react";
import { getCurrentUser } from "@/lib/server/current-user";
import { formatCurrency } from "@/lib/utils";
import { TestimonialsCarousel } from "@/components/landing/testimonials-carousel";
import { getSetting } from "@/lib/server/settings";

const FEATURES = [
  { icon: Mic, label: "Voice AI Tasks", description: "Read short prompts aloud and get paid per session." },
  { icon: Pickaxe, label: "Daily Mining", description: "Claim a free reward every day and build your streak." },
  { icon: Target, label: "Task Center", description: "Complete simple tasks and sponsored posts for cash." },
  { icon: Users, label: "Referral Program", description: "Earn commission from everyone you invite." },
  { icon: Wallet, label: "Multiple Wallets", description: "Track Main, Engagement, and Sales earnings separately." },
  { icon: Share2, label: "Sponsored Posts", description: "Share on social media to unlock bigger rewards." },
];

const STEPS = [
  { icon: UserPlus, title: "Create a free account", description: "Sign up in under a minute — no card required." },
  { icon: ListChecks, title: "Mine, talk, and complete tasks", description: "Earn daily from mining, voice tasks, and the Task Center." },
  { icon: Banknote, title: "Withdraw to bank or USDT", description: "Cash out instantly once your wallet is withdrawable." },
];

const VTU_SERVICES = [
  { icon: Smartphone, label: "Airtime" },
  { icon: Wifi, label: "Data" },
  { icon: Zap, label: "Electricity" },
  { icon: Tv, label: "Cable TV" },
  { icon: Banknote, label: "Airtime to Cash" },
];

const STATS = [
  { icon: Users, value: "12,576+", label: "Active users" },
  { icon: Banknote, value: "₦48.2M+", label: "Paid out" },
  { icon: ArrowUpRight, value: "3,140+", label: "Withdrawals" },
];

// Placeholder feed for the pre-launch landing page — swap for a live
// /api/activity-style feed of real payouts once the platform is public.
const RECENT_PAYOUTS = [
  { initials: "CO", name: "Chidi O.", method: "Bank Transfer", amount: 15000 },
  { initials: "AN", name: "Amaka N.", method: "USDT Withdrawal", amount: 32000 },
  { initials: "TA", name: "Tunde A.", method: "Bank Transfer", amount: 8200 },
  { initials: "BF", name: "Blessing F.", method: "Voice Task", amount: 2500 },
  { initials: "IK", name: "Ifeoma K.", method: "Referral Bonus", amount: 4800 },
  { initials: "MJ", name: "Musa J.", method: "Bank Transfer", amount: 21500 },
  { initials: "GE", name: "Grace E.", method: "Task Center", amount: 3600 },
  { initials: "SO", name: "Segun O.", method: "USDT Withdrawal", amount: 45000 },
];

const TESTIMONIALS = [
  {
    initials: "PA",
    name: "Peace A.",
    location: "Lagos",
    rating: 5,
    quote: "I withdraw to my bank every week. The voice tasks are quick and the Task Center pays well too.",
  },
  {
    initials: "DE",
    name: "David E.",
    location: "Abuja",
    rating: 5,
    quote: "Daily mining plus my referral earnings cover my data subscription every month. Simple and reliable.",
  },
  {
    initials: "HN",
    name: "Hauwa N.",
    location: "Kano",
    rating: 4,
    quote: "Withdrawals landed in my account fast. Support answered my question within the hour.",
  },
];

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "USER" ? "/dashboard" : "/admin");
  const logoUrl = await getSetting("site_logo_url", "");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md">
        <div className="profile-banner flex flex-col items-center gap-4 px-6 pb-12 pt-16 text-center">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded logo
            <img src={logoUrl} alt="SureCash Mining" className="h-24 w-auto" />
          )}
          <div className="flex items-end gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25">
              <Banknote className="h-5 w-5" />
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25">
              <Mic className="h-8 w-8" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25">
              <Pickaxe className="h-5 w-5" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">SureCash Mining</h1>
          <p className="max-w-xs text-base text-white/75">
            Earn real cash with your voice, daily mining, tasks, and referrals — all in one wallet.
          </p>
          <div className="mt-2 flex w-full max-w-xs flex-col gap-3">
            <Link
              href="/register"
              className="flex h-12 w-full items-center justify-center rounded-xl bg-white text-sm font-bold text-[#10201d]"
            >
              Create free account
            </Link>
            <Link
              href="/login"
              className="flex h-12 w-full items-center justify-center rounded-xl border border-white/40 text-sm font-semibold text-white"
            >
              Log in
            </Link>
          </div>

          <div className="mt-4 grid w-full grid-cols-3 gap-2">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="rounded-2xl bg-white/10 px-2 py-3 text-center ring-1 ring-white/15">
                <Icon className="mx-auto h-4 w-4 text-white/70" />
                <p className="mt-1 text-sm font-bold text-white">{value}</p>
                <p className="text-[10px] text-white/60">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6 px-5 py-8">
          <div className="card flex flex-col items-center gap-1 overflow-hidden p-0 pb-4 text-center">
            <img
              src="/illustrations/celebrate-cashout.svg"
              alt="People celebrating after a successful cash withdrawal"
              className="w-full"
            />
            <h2 className="mt-1 text-lg font-bold">Cash out. Celebrate. Repeat.</h2>
            <p className="max-w-xs px-6 text-sm text-foreground/60">
              Every day, members withdraw real money to their bank or USDT wallet. Yours could be next.
            </p>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Bills & VTU services</h2>
              <span className="rounded-full bg-brand-amber/15 px-2.5 py-1 text-[10px] font-bold text-[#a67c00]">
                Coming soon
              </span>
            </div>
            <p className="text-sm text-foreground/60">Pay for everyday essentials without leaving your wallet.</p>
            <div className="no-scrollbar mt-4 flex gap-4 overflow-x-auto pb-1">
              {VTU_SERVICES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-none flex-col items-center gap-1.5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-foreground/70">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold">Ways to earn</h2>
            <p className="text-sm text-foreground/60">Six earning streams, one wallet.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {FEATURES.map(({ icon: Icon, label, description }) => (
                <div key={label} className="card flex flex-col gap-2 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-foreground/50">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold">Recent payouts</h2>
            <p className="text-sm text-foreground/60">Real members, cashing out every day.</p>
            <div className="card relative mt-4 h-64 overflow-hidden p-0">
              <div className="animate-marquee-y flex flex-col">
                {[...RECENT_PAYOUTS, ...RECENT_PAYOUTS].map((p, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-primary/10 text-[11px] font-bold text-brand-primary">
                        {p.initials}
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{p.name}</p>
                        <p className="text-[10px] text-foreground/50">{p.method}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-brand-green">+{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-surface to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-surface to-transparent" />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold">What members are saying</h2>
            <TestimonialsCarousel testimonials={TESTIMONIALS} />
          </div>

          <div>
            <h2 className="text-lg font-bold">How it works</h2>
            <div className="mt-4 flex flex-col gap-3">
              {STEPS.map(({ icon: Icon, title, description }, i) => (
                <div key={title} className="card flex items-start gap-3 p-4">
                  <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full gradient-brand text-sm font-bold text-white">
                    {i + 1}
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      <Icon className="h-4 w-4 text-brand-primary" /> {title}
                    </p>
                    <p className="text-xs text-foreground/50">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/register"
            className="flex h-12 w-full items-center justify-center rounded-xl gradient-brand text-sm font-bold text-white"
          >
            Get started — it&apos;s free
          </Link>

          <p className="text-center text-xs text-foreground/40">
            © {new Date().getFullYear()} SureCash Mining. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

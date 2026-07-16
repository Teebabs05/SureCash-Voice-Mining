import { redirect } from "next/navigation";
import Link from "next/link";
import { Mic, Pickaxe, Target, Users, Wallet, Share2, UserPlus, ListChecks, Banknote } from "lucide-react";
import { getCurrentUser } from "@/lib/server/current-user";

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

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "USER" ? "/dashboard" : "/admin");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md">
        <div className="profile-banner flex flex-col items-center gap-4 px-6 pb-12 pt-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25">
            <Mic className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-white">SureCash Mining</h1>
          <p className="max-w-xs text-sm text-white/75">
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
        </div>

        <div className="flex flex-col gap-6 px-5 py-8">
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

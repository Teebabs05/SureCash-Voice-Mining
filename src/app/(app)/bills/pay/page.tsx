"use client";

import Link from "next/link";
import { ArrowLeft, Zap, Tv, Dice5, ChevronRight } from "lucide-react";
import { MainWalletBalance } from "@/components/bills/main-wallet-balance";

const BILL_SERVICES = [
  {
    label: "Electricity",
    icon: Zap,
    iconClass: "bg-brand-amber/15 text-[#a67c00]",
    description: "Pay electricity bills straight from your deposit wallet.",
    href: "/bills/electricity",
  },
  {
    label: "Cable TV",
    icon: Tv,
    iconClass: "bg-red-500/15 text-red-500",
    description: "Renew TV subscriptions straight from your deposit wallet.",
    href: "/bills/cable-tv",
  },
  {
    label: "Betting",
    icon: Dice5,
    iconClass: "bg-brand-green/15 text-brand-green",
    description: "Fund your betting account straight from your deposit wallet.",
    href: "/bills/betting",
  },
];

export default function PayBillsPage() {
  return (
    <div className="flex flex-col gap-4">
      <Link href="/dashboard" className="flex items-center gap-1 text-sm text-foreground/60">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-xl font-bold">Pay Bills</h1>

      <MainWalletBalance />

      <div className="flex flex-col gap-3">
        {BILL_SERVICES.map(({ label, icon: Icon, iconClass, description, href }) => (
          <Link key={href} href={href} className="card flex items-center gap-3 p-4">
            <div className={`flex h-11 w-11 flex-none items-center justify-center rounded-full ${iconClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs text-foreground/60">{description}</p>
            </div>
            <ChevronRight className="h-4 w-4 flex-none text-foreground/30" />
          </Link>
        ))}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowLeft, Smartphone, Wifi, Banknote, ChevronRight } from "lucide-react";
import { MainWalletBalance } from "@/components/bills/main-wallet-balance";

const VTU_SERVICES = [
  {
    label: "Airtime",
    icon: Smartphone,
    iconClass: "bg-brand-primary/15 text-brand-primary",
    description: "Buy airtime straight from your deposit wallet.",
    href: "/bills/airtime",
  },
  {
    label: "Data",
    icon: Wifi,
    iconClass: "bg-brand-green/15 text-brand-green",
    description: "Buy data bundles straight from your deposit wallet.",
    href: "/bills/data",
  },
  {
    label: "Airtime to Cash",
    icon: Banknote,
    iconClass: "bg-brand-amber/15 text-[#a67c00]",
    description: "Convert airtime into cash, credited to your Engagement wallet.",
    href: "/bills/airtime-to-cash",
  },
];

export default function BuyVtuPage() {
  return (
    <div className="flex flex-col gap-4">
      <Link href="/dashboard" className="flex items-center gap-1 text-sm text-foreground/60">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-xl font-bold">Buy VTU</h1>

      <MainWalletBalance />

      <div className="flex flex-col gap-3">
        {VTU_SERVICES.map(({ label, icon: Icon, iconClass, description, href }) => (
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

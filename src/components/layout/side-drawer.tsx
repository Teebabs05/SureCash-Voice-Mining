"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  X,
  Home,
  Gem,
  Wallet,
  Receipt,
  Smartphone,
  Zap,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  Bell,
  User,
  Rss,
  MessageCircle,
  Send,
  LogOut,
  Crown,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const links = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/earn", label: "Earn", icon: Gem },
  { href: "/plans", label: "Plans & Upgrade", icon: Crown },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/profile/transactions", label: "Transaction History", icon: Receipt },
  { href: "/bills/vtu", label: "Buy VTU", icon: Smartphone },
  { href: "/bills/pay", label: "Pay Bills", icon: Zap },
  { href: "/wallet/deposit", label: "Fund Wallet", icon: ArrowDownToLine },
  { href: "/wallet/withdraw", label: "Withdraw", icon: ArrowUpFromLine },
  { href: "/referrals", label: "Affiliate Program", icon: Users },
  { href: "/profile/notifications", label: "Notifications", icon: Bell },
  { href: "/feed", label: "Community Feed", icon: Rss },
  { href: "/support", label: "Support & FAQ", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
];

export function SideDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [social, setSocial] = useState<{ whatsappUrl: string; telegramUrl: string } | null>(null);

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    apiFetch<{ whatsappUrl: string; telegramUrl: string }>("/api/settings/social-links").then(setSocial);
  }, []);

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex h-full w-72 max-w-[80vw] flex-col gap-1 bg-surface p-4 shadow-xl">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-lg font-bold text-brand-primary">SureCash Mining</span>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-surface-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-surface-muted"
            >
              <Icon className="h-4 w-4 text-foreground/50" /> {label}
            </Link>
          ))}
        </nav>

        {(social?.whatsappUrl || social?.telegramUrl) && (
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            {social.whatsappUrl && (
              <a
                href={social.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-semibold text-white"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
            {social.telegramUrl && (
              <a
                href={social.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#229ED9] py-2.5 text-sm font-semibold text-white"
              >
                <Send className="h-4 w-4" /> Telegram
              </a>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-border pt-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-foreground/50">Appearance</p>
            <ThemeToggle />
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </div>
    </div>
  );
}

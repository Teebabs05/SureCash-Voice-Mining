"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Banknote,
  ArrowUpFromLine,
  Mic,
  ClipboardCheck,
  ShieldAlert,
  Bell,
  Settings,
  Ticket,
  Gift,
  LogOut,
  BarChart3,
  Crown,
  Menu,
  X,
  Landmark,
  Disc3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/deposits", label: "Deposits", icon: Banknote },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: ArrowUpFromLine },
  { href: "/admin/bank-accounts", label: "Bank Accounts", icon: Landmark },
  { href: "/admin/voice-tasks", label: "Voice Tasks", icon: Mic },
  { href: "/admin/tasks", label: "Task Center", icon: ClipboardCheck },
  { href: "/admin/spin-rewards", label: "Spin Wheel", icon: Disc3 },
  { href: "/admin/plans", label: "Plans", icon: Crown },
  { href: "/admin/promo-codes", label: "Promo Codes", icon: Gift },
  { href: "/admin/support", label: "Support Tickets", icon: Ticket },
  { href: "/admin/fraud", label: "Fraud Dashboard", icon: ShieldAlert },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const current = items.find((i) => i.href === pathname);

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <aside className="hidden w-64 flex-none flex-col border-r border-border bg-surface p-4 md:flex">
        <p className="mb-6 px-2 text-lg font-bold text-brand-primary">SureCash Admin</p>
        <nav className="flex flex-1 flex-col gap-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-brand-primary/10 text-brand-primary" : "text-foreground/60 hover:bg-surface-muted"
                )}
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col gap-3 border-t border-border pt-3">
          <ThemeToggle />
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </aside>

      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open admin menu"
          className="rounded-lg p-1.5 text-foreground/70 hover:bg-surface-muted"
        >
          <Menu className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold">{current?.label ?? "SureCash Admin"}</p>
        <button onClick={logout} aria-label="Log out" className="rounded-lg p-1.5 text-red-500 hover:bg-red-500/10">
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="relative flex h-full w-72 max-w-[80vw] flex-col gap-1 bg-surface p-4 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-lg font-bold text-brand-primary">SureCash Admin</span>
              <button onClick={() => setDrawerOpen(false)} className="rounded-full p-1.5 hover:bg-surface-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
              {items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                      active ? "bg-brand-primary/10 text-brand-primary" : "text-foreground/80 hover:bg-surface-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex flex-col gap-3 border-t border-border pt-3">
              <ThemeToggle />
              <button
                onClick={logout}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

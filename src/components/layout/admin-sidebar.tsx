"use client";

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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/deposits", label: "Deposits", icon: Banknote },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: ArrowUpFromLine },
  { href: "/admin/voice-tasks", label: "Voice Tasks", icon: Mic },
  { href: "/admin/tasks", label: "Task Center", icon: ClipboardCheck },
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
        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </aside>

      <nav className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border bg-surface p-2 md:hidden">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-none items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
                active ? "bg-brand-primary/10 text-brand-primary" : "text-foreground/60"
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

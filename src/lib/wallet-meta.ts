import { Wallet, Sparkles, Users, Rocket, TrendingUp, UserPlus } from "lucide-react";
import type { WalletType } from "@prisma/client";

export const WALLET_META: Record<
  WalletType,
  {
    label: string;
    gradient: string;
    icon: typeof Wallet;
    description: string;
    secondaryAction: { label: string; href: string; icon: typeof Wallet };
  }
> = {
  MAIN: {
    label: "Deposit Wallet",
    gradient: "gradient-wallet-main",
    icon: Wallet,
    description: "Deposits & site spending — not withdrawable",
    secondaryAction: { label: "Upgrade", href: "/plans", icon: Rocket },
  },
  ENGAGEMENT: {
    label: "Engagement Wallet",
    gradient: "gradient-wallet-engagement",
    icon: Sparkles,
    description: "Mining, voice, tasks & bonuses — withdrawable",
    secondaryAction: { label: "Earn more", href: "/earn", icon: TrendingUp },
  },
  SALES: {
    label: "Sales Wallet",
    gradient: "gradient-wallet-sales",
    icon: Users,
    description: "Referral commission — withdrawable",
    secondaryAction: { label: "Invite", href: "/referrals", icon: UserPlus },
  },
};

export const WALLET_ORDER: WalletType[] = ["MAIN", "ENGAGEMENT", "SALES"];

// Wallet-to-wallet transfers (and withdrawals) only ever involve these two -
// MAIN is deposit/site-spending only, never a transfer or withdrawal source.
export const TRANSFERABLE_WALLETS: WalletType[] = ["ENGAGEMENT", "SALES"];

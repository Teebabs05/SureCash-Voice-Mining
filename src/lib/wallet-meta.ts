import { Wallet, Sparkles, Users } from "lucide-react";
import type { WalletType } from "@prisma/client";

export const WALLET_META: Record<
  WalletType,
  { label: string; gradient: string; icon: typeof Wallet; description: string }
> = {
  MAIN: { label: "Main Wallet", gradient: "gradient-wallet-main", icon: Wallet, description: "Withdrawable balance" },
  ENGAGEMENT: {
    label: "Engagement Wallet",
    gradient: "gradient-wallet-engagement",
    icon: Sparkles,
    description: "Mining, voice, tasks & bonuses",
  },
  SALES: {
    label: "Sales Wallet",
    gradient: "gradient-wallet-sales",
    icon: Users,
    description: "Referral commission",
  },
};

export const WALLET_ORDER: WalletType[] = ["MAIN", "ENGAGEMENT", "SALES"];

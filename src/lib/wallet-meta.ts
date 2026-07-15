import { Wallet, Pickaxe, Mic, Users, ClipboardCheck, Gift } from "lucide-react";
import type { WalletType } from "@prisma/client";

export const WALLET_META: Record<
  WalletType,
  { label: string; gradient: string; icon: typeof Wallet; description: string }
> = {
  MAIN: { label: "Main Wallet", gradient: "gradient-wallet-main", icon: Wallet, description: "Withdrawable balance" },
  MINING: { label: "Mining Wallet", gradient: "gradient-wallet-mining", icon: Pickaxe, description: "From daily mining" },
  VOICE: { label: "Voice Wallet", gradient: "gradient-wallet-voice", icon: Mic, description: "From voice tasks" },
  REFERRAL: { label: "Referral Wallet", gradient: "gradient-wallet-referral", icon: Users, description: "From invites" },
  TASK: { label: "Task Wallet", gradient: "gradient-wallet-task", icon: ClipboardCheck, description: "From task center" },
  BONUS: { label: "Bonus Wallet", gradient: "gradient-wallet-bonus", icon: Gift, description: "Spins, missions & levels" },
};

export const WALLET_ORDER: WalletType[] = ["MAIN", "MINING", "VOICE", "REFERRAL", "TASK", "BONUS"];

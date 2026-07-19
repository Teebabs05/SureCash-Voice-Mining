import { getCredential } from "@/lib/server/credentials";
import { getSetting } from "@/lib/server/settings";
import * as korapay from "@/lib/payments/korapay";
import * as monnify from "@/lib/payments/monnify";
import * as flutterwave from "@/lib/payments/flutterwave";

export interface BankListEntry {
  code: string;
  name: string;
}

async function paystackListBanks(): Promise<BankListEntry[]> {
  const key = await getCredential("PAYSTACK_SECRET_KEY");
  if (!key) return [];

  const res = await fetch("https://api.paystack.co/bank?country=nigeria&currency=NGN", {
    headers: { Authorization: `Bearer ${key}` },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !Array.isArray(data?.data)) return [];

  return data.data.map((b: { code: string; name: string }) => ({ code: b.code, name: b.name }));
}

async function paystackResolveBankAccount(bankCode: string, accountNumber: string): Promise<string | null> {
  const key = await getCredential("PAYSTACK_SECRET_KEY");
  if (!key) return null;

  const res = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return null;

  const data = await res.json();
  return data?.data?.account_name ?? null;
}

export interface BankVerificationResult {
  accountName: string;
  /** True only when a real bank API confirmed this account number resolves
   * to an actual account name — the "automatic bank account verification"
   * the master plan describes. */
  verified: boolean;
  /** Whether a real verification provider is configured at all. When false,
   * `verified` is meaningless (no lookup was attempted) and the caller
   * should fall back to the existing "pending manual admin review" path. */
  configured: boolean;
}

type ProviderKey = "PAYSTACK" | "KORAPAY" | "MONNIFY" | "FLUTTERWAVE";

interface Provider {
  key: ProviderKey;
  isConfigured(): Promise<boolean>;
  listBanks(): Promise<BankListEntry[]>;
  resolveBankAccount(bankCode: string, accountNumber: string): Promise<string | null>;
}

const PROVIDERS: Provider[] = [
  {
    key: "PAYSTACK",
    isConfigured: async () => Boolean(await getCredential("PAYSTACK_SECRET_KEY")),
    listBanks: paystackListBanks,
    resolveBankAccount: paystackResolveBankAccount,
  },
  { key: "KORAPAY", isConfigured: korapay.isKorapayConfigured, listBanks: korapay.listBanks, resolveBankAccount: korapay.resolveBankAccount },
  { key: "MONNIFY", isConfigured: monnify.isMonnifyConfigured, listBanks: monnify.listBanks, resolveBankAccount: monnify.resolveBankAccount },
  {
    key: "FLUTTERWAVE",
    isConfigured: flutterwave.isFlutterwaveConfigured,
    listBanks: flutterwave.listBanks,
    resolveBankAccount: flutterwave.resolveBankAccount,
  },
];

/**
 * Picks the single provider used for BOTH the bank list and account
 * resolution on any given request. These can't be mixed across providers —
 * each gateway has its own bank code scheme, so a code fetched from one
 * provider's bank list isn't guaranteed to mean the same bank when handed to
 * another provider's resolve call. Prefers the admin's chosen default payout
 * provider (Admin > Settings > Payment Gateways) when it's one of the four
 * that support this and is actually configured, otherwise falls back
 * through a fixed priority order.
 */
async function getActiveProvider(): Promise<Provider | null> {
  const preferred = await getSetting("default_payout_provider", "PAYSTACK");
  const preferredProvider = PROVIDERS.find((p) => p.key === preferred);
  if (preferredProvider && (await preferredProvider.isConfigured())) return preferredProvider;

  for (const provider of PROVIDERS) {
    if (await provider.isConfigured()) return provider;
  }
  return null;
}

/**
 * Resolves an account number + bank code to the account holder's real name
 * via whichever payment gateway is configured (Paystack, Korapay, Monnify,
 * or Flutterwave). This is the live, instant lookup the withdrawal-account
 * UI calls as soon as a 10-digit account number is entered — no manual
 * "Verify" button, and saving is blocked until this comes back verified
 * (when a provider is configured).
 */
export async function resolveBankAccount(params: {
  bankCode: string;
  accountNumber: string;
}): Promise<BankVerificationResult> {
  const provider = await getActiveProvider();
  if (!provider) return { accountName: "", verified: false, configured: false };

  const accountName = await provider.resolveBankAccount(params.bankCode, params.accountNumber);
  if (!accountName) return { accountName: "", verified: false, configured: true };

  return { accountName, verified: true, configured: true };
}

// This static list is only used until a payment gateway key is configured
// (see getBankList below) — once one is, the active provider's live bank
// list takes over automatically. Codes here are used directly for real
// payout routing, so only add a bank once its NIBSS code is confirmed
// against a live provider list — do not guess.
const FALLBACK_BANKS: BankListEntry[] = [
  { code: "044", name: "Access Bank" },
  { code: "023", name: "Citibank Nigeria" },
  { code: "050", name: "Ecobank Nigeria" },
  { code: "070", name: "Fidelity Bank" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "214", name: "First City Monument Bank" },
  { code: "058", name: "Guaranty Trust Bank" },
  { code: "030", name: "Heritage Bank" },
  { code: "301", name: "Jaiz Bank" },
  { code: "082", name: "Keystone Bank" },
  { code: "50211", name: "Kuda Bank" },
  { code: "526", name: "Moniepoint MFB" },
  { code: "50515", name: "Moniepoint Microfinance Bank" },
  { code: "999992", name: "OPay Digital Services Limited (OPay)" },
  { code: "999991", name: "PalmPay" },
  { code: "076", name: "Polaris Bank" },
  { code: "101", name: "Providus Bank" },
  { code: "221", name: "Stanbic IBTC Bank" },
  { code: "068", name: "Standard Chartered Bank" },
  { code: "232", name: "Sterling Bank" },
  { code: "100", name: "Suntrust Bank" },
  { code: "032", name: "Union Bank of Nigeria" },
  { code: "033", name: "United Bank For Africa" },
  { code: "215", name: "Unity Bank" },
  { code: "035", name: "Wema Bank" },
  { code: "057", name: "Zenith Bank" },
];

let cachedBanks: { providerKey: ProviderKey; list: BankListEntry[]; fetchedAt: number } | null = null;
const BANK_LIST_TTL_MS = 60 * 60 * 1000;

/**
 * List of banks to populate the searchable dropdown with. Uses the active
 * provider's live bank list when one is configured (cached for an hour,
 * keyed by which provider it came from so switching the default payout
 * provider doesn't serve a stale list from a different bank-code scheme),
 * otherwise falls back to a static list of major Nigerian banks so the
 * picker still works without a key.
 */
export async function getBankList(): Promise<BankListEntry[]> {
  const provider = await getActiveProvider();
  if (!provider) return FALLBACK_BANKS;

  if (cachedBanks && cachedBanks.providerKey === provider.key && Date.now() - cachedBanks.fetchedAt < BANK_LIST_TTL_MS) {
    return cachedBanks.list;
  }

  try {
    const list = await provider.listBanks();
    if (list.length === 0) return FALLBACK_BANKS;
    cachedBanks = { providerKey: provider.key, list, fetchedAt: Date.now() };
    return list;
  } catch {
    return FALLBACK_BANKS;
  }
}

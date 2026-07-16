import { getCredential } from "@/lib/server/credentials";

export interface BankListEntry {
  code: string;
  name: string;
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

/**
 * Resolves an account number + bank code to the account holder's real name
 * via Paystack's bank-resolve endpoint. This is the live, instant lookup
 * the withdrawal-account UI calls as soon as a 10-digit account number is
 * entered — no manual "Verify" button, and saving is blocked until this
 * comes back verified (when a provider is configured).
 */
export async function resolveBankAccount(params: {
  bankCode: string;
  accountNumber: string;
}): Promise<BankVerificationResult> {
  const key = await getCredential("PAYSTACK_SECRET_KEY");
  if (!key) {
    return { accountName: "", verified: false, configured: false };
  }

  const res = await fetch(
    `https://api.paystack.co/bank/resolve?account_number=${params.accountNumber}&bank_code=${params.bankCode}`,
    { headers: { Authorization: `Bearer ${key}` } }
  );

  if (!res.ok) {
    return { accountName: "", verified: false, configured: true };
  }

  const data = await res.json();
  return { accountName: data.data.account_name, verified: true, configured: true };
}

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

let cachedBanks: { list: BankListEntry[]; fetchedAt: number } | null = null;
const BANK_LIST_TTL_MS = 60 * 60 * 1000;

/**
 * List of banks to populate the searchable dropdown with. Uses Paystack's
 * bank list when configured (cached for an hour), otherwise falls back to a
 * static list of major Nigerian banks so the picker still works without a
 * key.
 */
export async function getBankList(): Promise<BankListEntry[]> {
  const key = await getCredential("PAYSTACK_SECRET_KEY");
  if (!key) return FALLBACK_BANKS;

  if (cachedBanks && Date.now() - cachedBanks.fetchedAt < BANK_LIST_TTL_MS) {
    return cachedBanks.list;
  }

  try {
    const res = await fetch("https://api.paystack.co/bank?country=nigeria&currency=NGN", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return FALLBACK_BANKS;

    const data = await res.json();
    const list: BankListEntry[] = data.data.map((b: { code: string; name: string }) => ({ code: b.code, name: b.name }));
    cachedBanks = { list, fetchedAt: Date.now() };
    return list;
  } catch {
    return FALLBACK_BANKS;
  }
}

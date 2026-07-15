export interface BankVerificationResult {
  accountName: string;
  verified: boolean;
}

/**
 * Resolves an account number to an account name before allowing a
 * withdrawal destination to be saved. Uses Paystack's resolve endpoint when
 * a key is configured; otherwise falls back to an unverified placeholder
 * that an admin must confirm manually from the Fraud/Admin panel.
 */
export async function resolveBankAccount(params: {
  bankCode: string;
  accountNumber: string;
}): Promise<BankVerificationResult> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    return { accountName: "Unverified — pending manual review", verified: false };
  }

  const res = await fetch(
    `https://api.paystack.co/bank/resolve?account_number=${params.accountNumber}&bank_code=${params.bankCode}`,
    { headers: { Authorization: `Bearer ${key}` } }
  );

  if (!res.ok) {
    return { accountName: "Unverified — pending manual review", verified: false };
  }

  const data = await res.json();
  return { accountName: data.data.account_name, verified: true };
}

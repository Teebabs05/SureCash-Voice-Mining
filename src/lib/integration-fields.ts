/**
 * Single source of truth for which credential keys the admin "Payment
 * Gateways" panel can read/write — both the API route and the UI import
 * this so the allow-list can't drift out of sync between them.
 */
export const INTEGRATION_GROUPS = [
  {
    provider: "Paystack",
    fields: [{ key: "PAYSTACK_SECRET_KEY", label: "Secret key", placeholder: "sk_live_..." }],
  },
  {
    provider: "Monnify",
    fields: [
      { key: "MONNIFY_API_KEY", label: "API key", placeholder: "MK_PROD_..." },
      { key: "MONNIFY_SECRET_KEY", label: "Secret key", placeholder: "" },
      { key: "MONNIFY_CONTRACT_CODE", label: "Contract code", placeholder: "" },
      { key: "MONNIFY_WALLET_ACCOUNT_NUMBER", label: "Disbursement wallet account number", placeholder: "" },
    ],
  },
  {
    provider: "Korapay",
    fields: [{ key: "KORAPAY_SECRET_KEY", label: "Secret key", placeholder: "sk_live_..." }],
  },
  {
    provider: "Flutterwave",
    fields: [
      { key: "FLUTTERWAVE_SECRET_KEY", label: "Secret key", placeholder: "FLWSECK-..." },
      { key: "FLUTTERWAVE_WEBHOOK_HASH", label: "Webhook secret hash", placeholder: "" },
    ],
  },
  {
    provider: "PayVessel",
    fields: [
      { key: "PAYVESSEL_API_KEY", label: "API key", placeholder: "" },
      { key: "PAYVESSEL_SECRET_KEY", label: "Secret key", placeholder: "" },
    ],
  },
  {
    provider: "BillStack",
    fields: [
      { key: "BILLSTACK_SECRET_KEY", label: "Secret key", placeholder: "" },
      { key: "BILLSTACK_WEBHOOK_SECRET", label: "Webhook token", placeholder: "" },
    ],
  },
  {
    provider: "Binance (USDT withdrawals)",
    fields: [
      { key: "BINANCE_API_KEY", label: "API key", placeholder: "" },
      { key: "BINANCE_SECRET_KEY", label: "Secret key", placeholder: "" },
    ],
  },
] as const;

export const INTEGRATION_KEYS: string[] = INTEGRATION_GROUPS.flatMap((g) => g.fields.map((f) => f.key));

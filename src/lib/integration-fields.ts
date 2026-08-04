/**
 * Single source of truth for which credential keys the admin "Payment
 * Gateways" / "Notifications" panels can read/write — both the API route
 * and the UI import this so the allow-list can't drift out of sync.
 */
export const INTEGRATION_GROUPS = [
  {
    category: "Payment Gateways",
    provider: "Paystack",
    fields: [{ key: "PAYSTACK_SECRET_KEY", label: "Secret key", placeholder: "sk_live_..." }],
  },
  {
    category: "Payment Gateways",
    provider: "Monnify",
    fields: [
      { key: "MONNIFY_API_KEY", label: "API key", placeholder: "MK_PROD_..." },
      { key: "MONNIFY_SECRET_KEY", label: "Secret key", placeholder: "" },
      { key: "MONNIFY_CONTRACT_CODE", label: "Contract code", placeholder: "" },
      { key: "MONNIFY_WALLET_ACCOUNT_NUMBER", label: "Disbursement wallet account number", placeholder: "" },
    ],
  },
  {
    category: "Payment Gateways",
    provider: "Korapay",
    fields: [{ key: "KORAPAY_SECRET_KEY", label: "Secret key", placeholder: "sk_live_..." }],
  },
  {
    category: "Payment Gateways",
    provider: "Flutterwave",
    fields: [
      { key: "FLUTTERWAVE_SECRET_KEY", label: "Secret key", placeholder: "FLWSECK-..." },
      { key: "FLUTTERWAVE_WEBHOOK_HASH", label: "Webhook secret hash", placeholder: "" },
    ],
  },
  {
    category: "Payment Gateways",
    provider: "PayVessel",
    fields: [
      { key: "PAYVESSEL_API_KEY", label: "API key", placeholder: "" },
      { key: "PAYVESSEL_SECRET_KEY", label: "Secret key", placeholder: "" },
    ],
  },
  {
    category: "Payment Gateways",
    provider: "BillStack",
    fields: [
      { key: "BILLSTACK_SECRET_KEY", label: "Secret key", placeholder: "" },
      { key: "BILLSTACK_WEBHOOK_SECRET", label: "Webhook token", placeholder: "" },
    ],
  },
  {
    category: "Payment Gateways",
    provider: "Binance (USDT withdrawals)",
    fields: [
      { key: "BINANCE_API_KEY", label: "API key", placeholder: "" },
      { key: "BINANCE_SECRET_KEY", label: "Secret key", placeholder: "" },
    ],
  },
  {
    category: "Bills & VTU",
    provider: "VTU.ng",
    fields: [
      { key: "VTU_NG_USERNAME", label: "Account email or username", placeholder: "" },
      { key: "VTU_NG_PASSWORD", label: "Password", placeholder: "" },
    ],
  },
  {
    category: "Bills & VTU",
    provider: "VTUAfrica",
    fields: [{ key: "VTUAFRICA_API_KEY", label: "API key", placeholder: "" }],
  },
  {
    category: "Notifications",
    provider: "Email (Resend)",
    fields: [
      { key: "RESEND_API_KEY", label: "API key", placeholder: "re_..." },
      { key: "EMAIL_FROM", label: "From address", placeholder: "SureCash Mining <no-reply@surecash.app>" },
    ],
  },
  {
    category: "Notifications",
    provider: "SMS (Termii)",
    fields: [
      { key: "TERMII_API_KEY", label: "API key", placeholder: "" },
      { key: "TERMII_SENDER_ID", label: "Sender ID", placeholder: "SureCash" },
    ],
  },
  {
    category: "Notifications",
    provider: "WhatsApp (Meta Cloud API)",
    fields: [
      { key: "WHATSAPP_ACCESS_TOKEN", label: "Access token", placeholder: "" },
      { key: "WHATSAPP_PHONE_NUMBER_ID", label: "Phone number ID", placeholder: "" },
      { key: "WHATSAPP_TEMPLATE_NAME", label: "Approved template name (optional)", placeholder: "" },
      { key: "WHATSAPP_TEMPLATE_LANGUAGE", label: "Template language code (optional)", placeholder: "en_US" },
    ],
  },
  {
    category: "Voice Verification",
    provider: "Groq (recommended — free tier, usually no card needed)",
    fields: [{ key: "GROQ_API_KEY", label: "API key", placeholder: "gsk_..." }],
  },
  {
    category: "Voice Verification",
    provider: "Google Gemini",
    fields: [{ key: "GEMINI_API_KEY", label: "API key", placeholder: "AIza..." }],
  },
  {
    category: "Voice Verification",
    provider: "OpenAI Whisper",
    fields: [{ key: "OPENAI_API_KEY", label: "API key", placeholder: "sk-..." }],
  },
  {
    category: "Voice Verification",
    provider: "Azure Speech",
    fields: [
      { key: "AZURE_SPEECH_KEY", label: "API key", placeholder: "" },
      { key: "AZURE_SPEECH_REGION", label: "Region", placeholder: "e.g. westeurope" },
    ],
  },
] as const;

export const INTEGRATION_KEYS: string[] = INTEGRATION_GROUPS.flatMap((g) => g.fields.map((f) => f.key));

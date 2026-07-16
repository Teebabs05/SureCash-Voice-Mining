import "server-only";

/**
 * WhatsApp Business Cloud API (Meta Graph API) client — a notification
 * channel alongside push, sent only to users with a verified phone number.
 * A no-op until WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID are set, same
 * "safe stub" convention as the other notification providers.
 *
 * Real constraint worth knowing (not a bug in this code — how WhatsApp
 * Business actually works): Meta only allows free-form text to a user
 * within the 24-hour "customer service window" after they last messaged
 * your business number. Proactively notifying a user who hasn't messaged
 * you recently requires a pre-approved message template instead — you
 * create and get templates approved in Meta Business Manager, then set
 * WHATSAPP_TEMPLATE_NAME here. Without one, sendWhatsAppNotification()
 * falls back to free text, which will fail outside the session window —
 * that failure is caught and logged the same as any other provider error,
 * never silently dropped.
 */

const API_VERSION = "v21.0";
const BASE_URL = "https://graph.facebook.com";

function getConfig(): { accessToken: string; phoneNumberId: string } | null {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return accessToken && phoneNumberId ? { accessToken, phoneNumberId } : null;
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(getConfig());
}

function toE164Digits(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

async function postMessage(config: { accessToken: string; phoneNumberId: string }, body: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}/${API_VERSION}/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`WhatsApp send failed: ${data?.error?.message ?? res.statusText}`);
  }
}

export async function sendWhatsAppText(phone: string, message: string) {
  const config = getConfig();
  if (!config) throw new Error("WhatsApp is not configured");

  await postMessage(config, {
    messaging_product: "whatsapp",
    to: toE164Digits(phone),
    type: "text",
    text: { body: message },
  });
}

/** templateName must already be approved in Meta Business Manager; bodyParams fill its {{1}}, {{2}}... placeholders in order. */
export async function sendWhatsAppTemplate(phone: string, templateName: string, bodyParams: string[] = []) {
  const config = getConfig();
  if (!config) throw new Error("WhatsApp is not configured");

  await postMessage(config, {
    messaging_product: "whatsapp",
    to: toE164Digits(phone),
    type: "template",
    template: {
      name: templateName,
      language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US" },
      components: bodyParams.length
        ? [{ type: "body", parameters: bodyParams.map((text) => ({ type: "text", text })) }]
        : undefined,
    },
  });
}

export async function sendWhatsAppNotification(phone: string, title: string, body: string) {
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  if (templateName) {
    await sendWhatsAppTemplate(phone, templateName, [title, body]);
  } else {
    await sendWhatsAppText(phone, `*${title}*\n${body}`);
  }
}

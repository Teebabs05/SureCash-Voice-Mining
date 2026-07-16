import "server-only";
import { getCredential } from "@/lib/server/credentials";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage) {
    console.log("[email:console]", JSON.stringify(message, null, 2));
  }
}

/**
 * Resend's send API — picked over SendGrid/Postmark for being the simplest
 * single-endpoint JSON API to wire up with no SDK dependency. Auto-selected
 * whenever RESEND_API_KEY is configured (Admin > Settings > Notifications,
 * or the env var), same "presence = enabled" convention as WhatsApp/push.
 */
class ResendEmailProvider implements EmailProvider {
  constructor(
    private apiKey: string,
    private from: string
  ) {}

  async send(message: EmailMessage) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: this.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(`Resend send failed: ${data?.message ?? res.statusText}`);
    }
  }
}

async function getEmailProvider(): Promise<EmailProvider> {
  const apiKey = await getCredential("RESEND_API_KEY");
  if (apiKey) {
    const from = (await getCredential("EMAIL_FROM")) || "SureCash Mining <no-reply@surecash.app>";
    return new ResendEmailProvider(apiKey, from);
  }
  return new ConsoleEmailProvider();
}

export async function sendEmail(message: EmailMessage) {
  const provider = await getEmailProvider();
  await provider.send(message);
}

export function verificationEmailHtml(fullName: string, verifyUrl: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color:#0D8A82;">Verify your SureCash Mining account</h2>
      <p>Hi ${fullName},</p>
      <p>Thanks for signing up. Please confirm your email address to activate your account and start mining.</p>
      <a href="${verifyUrl}" style="display:inline-block;background:#0D8A82;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">Verify Email</a>
      <p>If the button doesn't work, copy this link: ${verifyUrl}</p>
    </div>
  `;
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function broadcastEmailHtml(fullName: string, subject: string, message: string) {
  const paragraphs = escapeHtml(message)
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replaceAll("\n", "<br/>")}</p>`)
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color:#0D8A82;">${escapeHtml(subject)}</h2>
      <p>Hi ${escapeHtml(fullName)},</p>
      ${paragraphs}
      <p style="color:#5c6b68; font-size: 13px; margin-top: 24px;">— The SureCash Mining team</p>
    </div>
  `;
}

export function manualDepositSubmittedEmailHtml(params: {
  fullName: string;
  email: string;
  amount: string;
  reference: string;
  reviewUrl: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color:#0D8A82;">New manual deposit awaiting review</h2>
      <p><strong>${escapeHtml(params.fullName)}</strong> (${escapeHtml(params.email)}) submitted a bank transfer receipt for approval.</p>
      <p style="margin: 16px 0;">
        <strong>Amount:</strong> ${escapeHtml(params.amount)}<br/>
        <strong>Reference:</strong> ${escapeHtml(params.reference)}
      </p>
      <a href="${params.reviewUrl}" style="display:inline-block;background:#0D8A82;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:8px 0;">Review in admin panel</a>
    </div>
  `;
}

export function otpEmailHtml(purpose: string, code: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color:#0D8A82;">Your SureCash Mining verification code</h2>
      <p>Use this code to ${purpose}:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color:#10201d; margin: 24px 0;">${code}</p>
      <p style="color:#5c6b68; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
}

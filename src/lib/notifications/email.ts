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

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Shared branded shell every email template renders inside - a teal wordmark
// header, a white card with the actual message, and a plain-text footer.
// Kept to inline styles/table-safe markup throughout since email clients
// don't run stylesheets or modern CSS.
function emailLayout(bodyHtml: string): string {
  return `
    <div style="background:#f7faf9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#10201d;">
      <div style="max-width:480px;margin:0 auto;">
        <div style="text-align:center;padding-bottom:20px;">
          <span style="display:inline-block;background:linear-gradient(135deg,#0D8A82,#075C56);color:#ffffff;font-weight:bold;font-size:18px;padding:10px 22px;border-radius:12px;letter-spacing:0.2px;">
            SureCash Mining
          </span>
        </div>
        <div style="background:#ffffff;border-radius:20px;padding:32px;box-shadow:0 4px 20px -4px rgba(13,138,130,0.15);">
          ${bodyHtml}
        </div>
        <p style="text-align:center;color:#8a9c98;font-size:12px;margin-top:20px;">
          © ${new Date().getFullYear()} SureCash Mining. All rights reserved.
        </p>
      </div>
    </div>
  `;
}

function emailButton(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#0D8A82,#075C56);color:#ffffff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:14px;margin:20px 0;">${label}</a>`;
}

function emailHeading(text: string): string {
  return `<h2 style="margin:0 0 16px;color:#10201d;font-size:20px;">${text}</h2>`;
}

export function passwordResetEmailHtml(fullName: string, resetUrl: string) {
  return emailLayout(`
    ${emailHeading("Reset your password")}
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hi ${escapeHtml(fullName)},</p>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">
      We got a request to reset your SureCash Mining password. Click below to choose a new one.
    </p>
    ${emailButton(resetUrl, "Reset Password")}
    <p style="margin:16px 0 0;font-size:12px;color:#8a9c98;word-break:break-all;">
      If the button doesn't work, copy this link: ${resetUrl}
    </p>
    <p style="margin:16px 0 0;font-size:13px;color:#8a9c98;">
      This link expires in 1 hour. If you didn't request this, you can safely ignore this email - your
      password won't change.
    </p>
  `);
}

export function verificationEmailHtml(fullName: string, verifyUrl: string) {
  return emailLayout(`
    ${emailHeading("Verify your account")}
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hi ${escapeHtml(fullName)},</p>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">
      Thanks for signing up. Please confirm your email address to activate your account and start earning.
    </p>
    ${emailButton(verifyUrl, "Verify Email")}
    <p style="margin:16px 0 0;font-size:12px;color:#8a9c98;word-break:break-all;">
      If the button doesn't work, copy this link: ${verifyUrl}
    </p>
  `);
}

export function broadcastEmailHtml(fullName: string, subject: string, message: string) {
  const paragraphs = escapeHtml(message)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;">${p.replaceAll("\n", "<br/>")}</p>`)
    .join("");

  return emailLayout(`
    ${emailHeading(escapeHtml(subject))}
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hi ${escapeHtml(fullName)},</p>
    ${paragraphs}
    <p style="color:#8a9c98;font-size:13px;margin-top:20px;">— The SureCash Mining team</p>
  `);
}

export function manualDepositSubmittedEmailHtml(params: {
  fullName: string;
  email: string;
  amount: string;
  reference: string;
  reviewUrl: string;
}) {
  return emailLayout(`
    ${emailHeading("New manual deposit awaiting review")}
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      <strong>${escapeHtml(params.fullName)}</strong> (${escapeHtml(params.email)}) submitted a bank transfer
      receipt for approval.
    </p>
    <div style="background:#eef3f2;border-radius:12px;padding:16px;font-size:14px;line-height:1.8;">
      <strong>Amount:</strong> ${escapeHtml(params.amount)}<br/>
      <strong>Reference:</strong> ${escapeHtml(params.reference)}
    </div>
    ${emailButton(params.reviewUrl, "Review in admin panel")}
  `);
}

export function withdrawalPendingReviewEmailHtml(params: {
  fullName: string;
  email: string;
  amount: string;
  method: string;
  reference: string;
  reviewUrl: string;
}) {
  return emailLayout(`
    ${emailHeading("Withdrawal awaiting manual processing")}
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      <strong>${escapeHtml(params.fullName)}</strong> (${escapeHtml(params.email)}) requested a
      ${escapeHtml(params.method)} withdrawal that couldn't be paid out automatically.
    </p>
    <div style="background:#eef3f2;border-radius:12px;padding:16px;font-size:14px;line-height:1.8;">
      <strong>Amount:</strong> ${escapeHtml(params.amount)}<br/>
      <strong>Reference:</strong> ${escapeHtml(params.reference)}
    </div>
    ${emailButton(params.reviewUrl, "Review in admin panel")}
  `);
}

export function otpEmailHtml(purpose: string, code: string) {
  return emailLayout(`
    ${emailHeading("Your verification code")}
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Use this code to ${escapeHtml(purpose)}:</p>
    <p style="text-align:center;font-size:34px;font-weight:bold;letter-spacing:10px;color:#0D8A82;margin:24px 0;">${escapeHtml(code)}</p>
    <p style="color:#8a9c98;font-size:13px;margin:0;">
      This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
    </p>
  `);
}

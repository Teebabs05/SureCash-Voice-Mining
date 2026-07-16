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

// Add a Resend/SendGrid-backed provider here and switch on
// process.env.EMAIL_PROVIDER once real credentials are available.
function getEmailProvider(): EmailProvider {
  return new ConsoleEmailProvider();
}

export async function sendEmail(message: EmailMessage) {
  const provider = getEmailProvider();
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

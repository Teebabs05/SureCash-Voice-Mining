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
      <h2 style="color:#6A00FF;">Verify your SureCash Mining account</h2>
      <p>Hi ${fullName},</p>
      <p>Thanks for signing up. Please confirm your email address to activate your account and start mining.</p>
      <a href="${verifyUrl}" style="display:inline-block;background:#6A00FF;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">Verify Email</a>
      <p>If the button doesn't work, copy this link: ${verifyUrl}</p>
    </div>
  `;
}

export function otpEmailHtml(purpose: string, code: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color:#6A00FF;">Your SureCash Mining verification code</h2>
      <p>Use this code to ${purpose}:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color:#17122b; margin: 24px 0;">${code}</p>
      <p style="color:#6b6480; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
}

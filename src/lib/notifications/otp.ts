import "server-only";
import { getCredential } from "@/lib/server/credentials";

export interface OtpProvider {
  sendOtp(destination: string, code: string): Promise<void>;
}

class ConsoleOtpProvider implements OtpProvider {
  async sendOtp(destination: string, code: string) {
    console.log(`[otp:console] Sending OTP ${code} to ${destination}`);
  }
}

/**
 * Converts a phone number to the international format Termii expects
 * (digits only, no leading "+"). Also handles the common local Nigerian
 * format (leading "0") by swapping it for the "234" country code, since
 * that's how most users type their number.
 */
function toTermiiFormat(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (phone.trim().startsWith("+")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

/**
 * Termii's plain SMS send API — we generate and verify OTP codes ourselves
 * (see OtpCode model / generateOtpCode()), so this just delivers the code by
 * text rather than using Termii's own separate OTP/Token API, which manages
 * a pin lifecycle we'd have no use for.
 *
 * Built from stable, long-documented public API knowledge — this sandbox's
 * network policy blocks api.ng.termii.com (same restriction that blocked
 * billstack.co), so it could not be verified against a live response.
 * Verify against your Termii dashboard/sandbox before relying on it in
 * production; a wrong field name will surface as a clear thrown error
 * (caught by the calling route), not a silent failure.
 */
class TermiiOtpProvider implements OtpProvider {
  constructor(
    private apiKey: string,
    private senderId: string
  ) {}

  async sendOtp(destination: string, code: string) {
    const res = await fetch("https://api.ng.termii.com/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: this.apiKey,
        to: toTermiiFormat(destination),
        from: this.senderId,
        sms: `Your SureCash Mining verification code is ${code}. It expires in 10 minutes.`,
        type: "plain",
        channel: "generic",
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.message_id === undefined) {
      throw new Error(`Termii SMS send failed: ${data?.message ?? res.statusText}`);
    }
  }
}

async function getOtpProvider(): Promise<OtpProvider> {
  const apiKey = await getCredential("TERMII_API_KEY");
  if (apiKey) {
    const senderId = (await getCredential("TERMII_SENDER_ID")) || "SureCash";
    return new TermiiOtpProvider(apiKey, senderId);
  }
  return new ConsoleOtpProvider();
}

export async function sendOtpCode(destination: string, code: string) {
  const provider = await getOtpProvider();
  await provider.sendOtp(destination, code);
}

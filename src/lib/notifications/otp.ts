export interface OtpProvider {
  sendOtp(destination: string, code: string): Promise<void>;
}

class ConsoleOtpProvider implements OtpProvider {
  async sendOtp(destination: string, code: string) {
    console.log(`[otp:console] Sending OTP ${code} to ${destination}`);
  }
}

// Swap in a Termii/Twilio-backed provider once credentials are configured.
function getOtpProvider(): OtpProvider {
  return new ConsoleOtpProvider();
}

export async function sendOtpCode(destination: string, code: string) {
  const provider = getOtpProvider();
  await provider.sendOtp(destination, code);
}

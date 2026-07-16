import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server/current-user";
import { handleApiError, jsonError } from "@/lib/server/api-response";
import { isValidCryptoAddress } from "@/lib/payments/crypto-wallet";
import { generateOtpCode, hashToken } from "@/lib/server/auth";
import { sendOtpCode } from "@/lib/notifications/otp";
import { sendEmail } from "@/lib/notifications/email";

const schema = z.object({
  network: z.enum(["TRC20", "ERC20", "BEP20"]),
  address: z.string().min(20).max(64),
});

export async function GET() {
  try {
    const user = await requireUser();
    const wallets = await prisma.cryptoWallet.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ wallets });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    if (!isValidCryptoAddress(body.network, body.address)) {
      return jsonError(`This doesn't look like a valid ${body.network} address`, 422);
    }

    const existing = await prisma.cryptoWallet.findUnique({
      where: { userId_address_network: { userId: user.id, address: body.address, network: body.network } },
    });
    if (existing) return jsonError("This wallet address is already linked", 409);

    const wallet = await prisma.cryptoWallet.create({
      data: { userId: user.id, address: body.address, network: body.network, isVerified: false },
    });

    // OTP confirms the wallet owner authorized adding this payout destination
    // — there's no bank-style name-resolution API for crypto, so this is the
    // only ownership confirmation available.
    const code = generateOtpCode();
    const codeHash = await hashToken(code);
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        purpose: "WITHDRAWAL",
        codeHash,
        metadata: { cryptoWalletId: wallet.id },
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    if (user.phone) {
      await sendOtpCode(user.phone, code);
    } else {
      await sendEmail({ to: user.email, subject: "Confirm your new USDT wallet", html: `<p>Your OTP is <b>${code}</b>. It expires in 10 minutes.</p>` });
    }

    return NextResponse.json({ wallet, requiresOtp: true });
  } catch (error) {
    return handleApiError(error);
  }
}

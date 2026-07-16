import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/server/push";

export async function GET() {
  return NextResponse.json({ publicKey: getVapidPublicKey() });
}

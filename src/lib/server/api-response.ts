import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/server/current-user";
import { InsufficientBalanceError } from "@/lib/server/wallet";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError(error.issues[0]?.message ?? "Invalid request", 422);
  }
  if (error instanceof AuthError) {
    return jsonError(error.message, error.status);
  }
  if (error instanceof InsufficientBalanceError) {
    return jsonError(error.message, 400);
  }
  if (error instanceof Error) {
    console.error(error);
    return jsonError(error.message, 400);
  }
  console.error(error);
  return jsonError("Something went wrong", 500);
}

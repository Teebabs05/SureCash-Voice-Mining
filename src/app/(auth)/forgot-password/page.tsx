"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Check your email</h2>
        <p className="text-sm text-foreground/60">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your password. It
          expires in 1 hour.
        </p>
        <Link href="/login" className="text-center text-sm font-medium text-brand-primary">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Link href="/login" className="flex w-fit items-center gap-1.5 text-xs font-medium text-foreground/50 hover:text-foreground/70">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to login
      </Link>
      <h2 className="text-lg font-semibold">Forgot password</h2>
      <p className="text-sm text-foreground/60">Enter your email and we&apos;ll send you a link to reset it.</p>
      <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" loading={loading} className="w-full">
        Send reset link
      </Button>
    </form>
  );
}

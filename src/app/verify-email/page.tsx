"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const uid = searchParams.get("uid");

    async function run() {
      if (!token || !uid) throw new Error("Missing verification details.");
      await apiFetch("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ token, uid }) });
    }

    run()
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Verification failed");
      });
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center gradient-brand px-4">
      <div className="card w-full max-w-md p-8 text-center">
        {status === "loading" && <p>Verifying your email…</p>}
        {status === "success" && (
          <>
            <h1 className="text-lg font-semibold text-brand-green">Email verified!</h1>
            <p className="mt-2 text-sm text-foreground/70">
              Your account is now fully active. You can start mining and earning.
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="text-lg font-semibold text-red-500">Verification failed</h1>
            <p className="mt-2 text-sm text-foreground/70">{message}</p>
          </>
        )}
        <Link href="/dashboard">
          <Button className="mt-6 w-full">Go to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

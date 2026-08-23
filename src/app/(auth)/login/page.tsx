"use client";

import { Suspense, useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Home, Fingerprint } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { biometricSupported, loginWithBiometric } from "@/lib/biometric-client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() =>
    searchParams.get("reason") === "idle" ? "You were logged out after 15 minutes of inactivity. Please log in again." : null
  );
  const [form, setForm] = useState({ email: "", password: "" });
  const [pending2fa, setPending2fa] = useState<{ uid: string } | null>(null);
  const [code, setCode] = useState("");
  const [showBiometric, setShowBiometric] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time browser capability check
    setShowBiometric(biometricSupported());
  }, []);

  async function onBiometricLogin() {
    setError(null);
    setBiometricLoading(true);
    try {
      const res = await loginWithBiometric();
      router.push(res.user.role === "USER" ? "/dashboard" : "/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Biometric login failed");
    } finally {
      setBiometricLoading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ user?: { role: string }; requires2fa?: boolean; uid?: string }>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify(form) }
      );
      if (res.requires2fa && res.uid) {
        setPending2fa({ uid: res.uid });
      } else if (res.user) {
        router.push(res.user.role === "USER" ? "/dashboard" : "/admin");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function onVerify2fa(e: FormEvent) {
    e.preventDefault();
    if (!pending2fa) return;
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ user: { role: string } }>("/api/auth/2fa/verify", {
        method: "POST",
        body: JSON.stringify({ uid: pending2fa.uid, code }),
      });
      router.push(res.user.role === "USER" ? "/dashboard" : "/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  if (pending2fa) {
    return (
      <form onSubmit={onVerify2fa} className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Enter your login code</h2>
        <p className="text-sm text-foreground/60">We sent a 6-digit code to your email.</p>
        <Input label="Code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" required />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Verify & continue
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Link href="/" className="flex w-fit items-center gap-1.5 text-xs font-medium text-foreground/50 hover:text-foreground/70">
        <Home className="h-3.5 w-3.5" /> Home
      </Link>
      <div>
        <h2 className="text-3xl font-bold">Welcome back</h2>
        <p className="mt-1 text-sm text-foreground/60">Log in to keep earning with SureCash Mining.</p>
      </div>
      <Input
        label="Email"
        type="email"
        required
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <Input
        label="Password"
        type="password"
        required
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <Link href="/forgot-password" className="-mt-2 text-right text-xs font-medium text-brand-primary">
        Forgot password?
      </Link>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" loading={loading} className="w-full">
        Log in
      </Button>
      {showBiometric && (
        <Button
          type="button"
          variant="outline"
          loading={biometricLoading}
          onClick={onBiometricLogin}
          className="w-full"
        >
          <Fingerprint className="h-4 w-4" /> Log in with biometrics
        </Button>
      )}
      <p className="text-center text-sm text-foreground/60">
        New to SureCash Mining?{" "}
        <Link href="/register" className="font-medium text-brand-primary">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-sm text-foreground/50">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}

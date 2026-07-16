"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";

interface Me {
  user: {
    fullName: string;
    email: string;
    phone: string | null;
    emailVerified: boolean;
    phoneVerified: boolean;
  };
}

export default function PersonalInfoPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me["user"] | null>(null);
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<Me>("/api/auth/me").then((res) => {
      setMe(res.user);
      setFullName(res.user.fullName);
    });
  }, []);

  async function save() {
    setSaving(true);
    try {
      await apiFetch("/api/profile", { method: "PATCH", body: JSON.stringify({ fullName }) });
      toast.success("Name updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update name");
    } finally {
      setSaving(false);
    }
  }

  if (!me) return <p className="py-10 text-center text-sm text-foreground/50">Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-foreground/60">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-xl font-bold">Personal Info</h1>

      <Card>
        <CardHeader>
          <CardTitle>Full name</CardTitle>
        </CardHeader>
        <div className="flex flex-col gap-3">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Button loading={saving} disabled={!fullName.trim() || fullName === me.fullName} onClick={save}>
            Save
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
        </CardHeader>
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground/70">{me.email}</p>
          {me.emailVerified ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-brand-green">
              <CheckCircle2 className="h-3.5 w-3.5" /> Verified
            </span>
          ) : (
            <span className="text-xs font-semibold text-brand-amber">Unverified</span>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phone number</CardTitle>
        </CardHeader>
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground/70">{me.phone ?? "Not added yet"}</p>
          {me.phoneVerified ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-brand-green">
              <CheckCircle2 className="h-3.5 w-3.5" /> Verified
            </span>
          ) : (
            <button className="text-xs font-semibold text-brand-primary" onClick={() => router.push("/profile/security")}>
              {me.phone ? "Verify" : "Add"}
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}

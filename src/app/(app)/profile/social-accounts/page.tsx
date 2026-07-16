"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";

interface SocialAccounts {
  facebookUrl: string | null;
  instagramHandle: string | null;
  tiktokHandle: string | null;
}

export default function SocialAccountsPage() {
  const router = useRouter();
  const [form, setForm] = useState({ facebookUrl: "", instagramHandle: "", tiktokHandle: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<{ socialAccounts: SocialAccounts }>("/api/profile/social-accounts")
      .then((res) =>
        setForm({
          facebookUrl: res.socialAccounts.facebookUrl ?? "",
          instagramHandle: res.socialAccounts.instagramHandle ?? "",
          tiktokHandle: res.socialAccounts.tiktokHandle ?? "",
        })
      )
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      await apiFetch("/api/profile/social-accounts", { method: "PUT", body: JSON.stringify(form) });
      toast.success("Social links saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save social links");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="py-10 text-center text-sm text-foreground/50">Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-foreground/60">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div>
        <h1 className="text-xl font-bold">Social Accounts</h1>
        <p className="text-sm text-foreground/60">Link at least 2 for sponsored tasks</p>
      </div>

      <Card className="flex flex-col gap-4">
        <Input
          name="facebookUrl"
          label="Facebook Profile"
          placeholder="facebook.com/yourname or username"
          value={form.facebookUrl}
          onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
        />
        <Input
          name="instagramHandle"
          label="Instagram Handle"
          placeholder="@yourhandle or instagram.com/yourhandle"
          value={form.instagramHandle}
          onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })}
        />
        <Input
          name="tiktokHandle"
          label="TikTok Handle"
          placeholder="@yourhandle or tiktok.com/@yourhandle"
          value={form.tiktokHandle}
          onChange={(e) => setForm({ ...form, tiktokHandle: e.target.value })}
        />
        <Button loading={saving} onClick={save}>
          Save Social Links
        </Button>
      </Card>
    </div>
  );
}

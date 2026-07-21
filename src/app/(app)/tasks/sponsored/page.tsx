"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2,
  Clock,
  Copy,
  Image as ImageIcon,
  MessageCircle,
  Music2,
  ThumbsUp,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { PlanGateBanner } from "@/components/plan-gate-banner";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

type Platform = "FACEBOOK" | "INSTAGRAM" | "TIKTOK" | "WHATSAPP";
type ShareStatus = "AVAILABLE" | "APPROVED" | "REJECTED";

interface PlatformStatus {
  platform: Platform;
  status: ShareStatus;
  reviewNote: string | null;
}

interface CampaignResponse {
  planRequired: boolean;
  sectionDailyLimit: number | null;
  sectionCompletedToday: number;
  configured: boolean;
  caption: string;
  bannerUrl: string;
  linkUrl: string;
  shareUrl: string;
  rewardAmount: number;
  platforms: PlatformStatus[];
}

const PLATFORM_META: Record<
  Platform,
  { label: string; icon: typeof ThumbsUp; iconClass: string; mode: "intent" | "copy" }
> = {
  FACEBOOK: { label: "Facebook", icon: ThumbsUp, iconClass: "bg-[#1877F2]/15 text-[#1877F2]", mode: "intent" },
  WHATSAPP: { label: "WhatsApp", icon: MessageCircle, iconClass: "bg-[#25D366]/15 text-[#25D366]", mode: "intent" },
  INSTAGRAM: { label: "Instagram", icon: ImageIcon, iconClass: "bg-[#E1306C]/15 text-[#E1306C]", mode: "copy" },
  TIKTOK: { label: "TikTok", icon: Music2, iconClass: "bg-foreground/10 text-foreground", mode: "copy" },
};

const PLATFORM_ORDER: Platform[] = ["FACEBOOK", "WHATSAPP", "INSTAGRAM", "TIKTOK"];

function shareIntentUrl(platform: Platform, caption: string, shareUrl: string) {
  const text = `${caption}\n\n${shareUrl}`;
  if (platform === "FACEBOOK") {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(caption)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export default function SponsoredPostsPage() {
  const [data, setData] = useState<CampaignResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [proofPlatform, setProofPlatform] = useState<Platform | null>(null);
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    apiFetch<CampaignResponse>("/api/sponsored-posts")
      .then(setData)
      .catch(() => toast.error("Could not load sponsored posts"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openShare(platform: Platform) {
    if (!data) return;
    const limitReached =
      data.sectionDailyLimit !== null && data.sectionCompletedToday >= data.sectionDailyLimit;
    if (limitReached) {
      toast.error(`You've reached today's plan limit for Sponsored Posts (${data.sectionDailyLimit}/day)`);
      return;
    }
    const meta = PLATFORM_META[platform];
    if (meta.mode === "intent") {
      window.open(shareIntentUrl(platform, data.caption, data.shareUrl), "_blank", "noopener,noreferrer");
    } else {
      const text = `${data.caption}\n\n${data.shareUrl}`;
      navigator.clipboard
        .writeText(text)
        .then(() => toast.success(`Caption copied! Paste it into your ${meta.label} post.`))
        .catch(() => toast.error("Could not copy caption"));
      window.open(data.shareUrl, "_blank", "noopener,noreferrer");
    }
    setProofPlatform(platform);
    setProofImage(null);
  }

  async function submitProof() {
    if (!proofPlatform || !proofImage) {
      toast.error("Upload a screenshot of your post first");
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("platform", proofPlatform);
      form.append("proofImage", proofImage);
      const res = await apiFetch<{ reward: number }>("/api/sponsored-posts/share", {
        method: "POST",
        body: form,
        headers: {},
      });
      toast.success(`Approved! +${formatCurrency(res.reward)} added to your Engagement wallet`);
      setProofPlatform(null);
      setProofImage(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not submit proof");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="py-10 text-center text-sm text-foreground/50">Loading…</p>;

  if (!data?.configured) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-bold">Sponsored Posts</h1>
          <p className="text-sm text-foreground/60">Share posts on your social accounts to earn.</p>
        </div>
        <p className="py-10 text-center text-sm text-foreground/50">No sponsored posts available right now. Check back later.</p>
      </div>
    );
  }

  const limitReached =
    data.sectionDailyLimit !== null && data.sectionCompletedToday >= data.sectionDailyLimit;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Sponsored Posts</h1>
        <p className="text-sm text-foreground/60">
          Share the post below to earn {formatCurrency(data.rewardAmount)} per platform
          {data.sectionDailyLimit !== null ? `, up to ${data.sectionDailyLimit} shares a day` : ""}.
        </p>
      </div>

      {data.planRequired && <PlanGateBanner reason="free_trial" feature="sponsored posts" />}
      {!data.planRequired && limitReached && (
        <PlanGateBanner reason="limit_reached" feature="submit sponsored posts" dailyLimit={data.sectionDailyLimit ?? undefined} />
      )}

      <Card className="flex flex-col gap-3">
        {data.bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded campaign banner preview
          <img src={data.bannerUrl} alt="" className="w-full rounded-xl" />
        )}
        <p className="text-sm">{data.caption}</p>
        <p className="truncate text-xs text-foreground/50">{data.shareUrl}</p>
      </Card>

      <div className="flex flex-col gap-3">
        {PLATFORM_ORDER.map((platform) => {
          const meta = PLATFORM_META[platform];
          const Icon = meta.icon;
          const status = data.platforms.find((p) => p.platform === platform);
          const isOpenProof = proofPlatform === platform;

          return (
            <Card key={platform}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2.5 ${meta.iconClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">{meta.label}</p>
                    <p className="text-xs font-semibold text-brand-green">{formatCurrency(data.rewardAmount)}</p>
                  </div>
                </div>

                {status?.status === "APPROVED" ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-brand-green">
                    <CheckCircle2 className="h-4 w-4" /> Paid
                  </span>
                ) : status?.status === "REJECTED" ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                    <XCircle className="h-4 w-4" /> Rejected
                  </span>
                ) : (
                  <Button size="sm" disabled={limitReached} onClick={() => openShare(platform)}>
                    {meta.mode === "copy" ? <Copy className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                    Share
                  </Button>
                )}
              </div>

              {status?.status === "REJECTED" && status.reviewNote && (
                <p className="mt-2 text-xs text-red-500">{status.reviewNote}</p>
              )}

              {isOpenProof && status?.status === "AVAILABLE" && (
                <div className="mt-3 flex flex-col gap-2 rounded-xl bg-surface-muted p-3">
                  <p className="text-xs text-foreground/60">
                    Upload a screenshot of your {meta.label} post to get paid instantly.
                  </p>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-4 text-sm text-foreground/60">
                    <Upload className="h-4 w-4" />
                    {proofImage ? proofImage.name : "Upload screenshot"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setProofImage(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <Button size="sm" loading={submitting} onClick={submitProof}>
                    Submit for reward
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="flex items-start gap-2 text-xs text-foreground/50">
        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>Shares reset daily. Instagram and TikTok don&apos;t support pre-filled posts, so the caption is copied for you to paste in.</span>
      </Card>
    </div>
  );
}

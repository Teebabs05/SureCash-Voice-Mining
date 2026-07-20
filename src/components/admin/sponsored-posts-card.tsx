"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";

interface Setting {
  key: string;
  value: unknown;
}

export function SponsoredPostsCard() {
  const [caption, setCaption] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [rewardAmount, setRewardAmount] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [savingCaption, setSavingCaption] = useState(false);
  const [savingLink, setSavingLink] = useState(false);
  const [savingReward, setSavingReward] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  useEffect(() => {
    apiFetch<{ settings: Setting[] }>("/api/admin/settings").then((res) => {
      const map = new Map(res.settings.map((s) => [s.key, s.value]));
      if (map.has("sponsored_post_caption")) setCaption(String(map.get("sponsored_post_caption")));
      if (map.has("sponsored_post_link_url")) setLinkUrl(String(map.get("sponsored_post_link_url")));
      if (map.has("sponsored_post_reward_amount")) setRewardAmount(String(map.get("sponsored_post_reward_amount")));
      if (map.has("sponsored_post_banner_url")) setBannerUrl(String(map.get("sponsored_post_banner_url")));
    });
  }, []);

  async function saveCaption() {
    const value = caption.trim();
    if (!value) return toast.error("Caption can't be empty");
    setSavingCaption(true);
    try {
      await apiFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ key: "sponsored_post_caption", value }),
      });
      toast.success("Caption updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save caption");
    } finally {
      setSavingCaption(false);
    }
  }

  async function saveLink() {
    const value = linkUrl.trim();
    if (!value) return toast.error("Link can't be empty");
    setSavingLink(true);
    try {
      await apiFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ key: "sponsored_post_link_url", value }),
      });
      toast.success("Link updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save link");
    } finally {
      setSavingLink(false);
    }
  }

  async function saveReward() {
    const numeric = Number(rewardAmount);
    if (!rewardAmount || Number.isNaN(numeric) || numeric <= 0) {
      return toast.error("Enter a valid reward amount");
    }
    setSavingReward(true);
    try {
      await apiFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ key: "sponsored_post_reward_amount", value: numeric }),
      });
      toast.success("Reward amount updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save reward amount");
    } finally {
      setSavingReward(false);
    }
  }

  async function uploadBanner() {
    if (!bannerFile) return toast.error("Choose an image first");
    setUploadingBanner(true);
    try {
      const form = new FormData();
      form.append("banner", bannerFile);
      const res = await apiFetch<{ bannerUrl: string }>("/api/admin/settings/sponsored-banner", {
        method: "POST",
        body: form,
        headers: {},
      });
      setBannerUrl(res.bannerUrl);
      setBannerFile(null);
      toast.success("Banner updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not upload banner");
    } finally {
      setUploadingBanner(false);
    }
  }

  async function removeBanner() {
    setUploadingBanner(true);
    try {
      await apiFetch("/api/admin/settings/sponsored-banner", { method: "DELETE" });
      setBannerUrl("");
      toast.success("Banner removed");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not remove banner");
    } finally {
      setUploadingBanner(false);
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Sponsored posts</CardTitle>
      </CardHeader>
      <p className="mb-3 text-xs text-foreground/50">
        Users share this post on Facebook, WhatsApp, Instagram, and TikTok and get paid per platform (up to 4
        shares a day, one per platform). The caption, link, and banner below are auto-composed for them — they
        just tap Share.
      </p>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground/80">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            placeholder="e.g. Earn real cash with your voice, daily mining, tasks, and referrals on SureCash Mining!"
            className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-foreground/40 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          />
          <Button size="sm" loading={savingCaption} onClick={saveCaption} className="self-end">
            Save caption
          </Button>
        </div>

        <div className="flex items-end gap-2">
          <Input
            label="Link URL"
            placeholder="https://voicearn.surecashmining.com.ng/register?ref=..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
          <Button size="sm" loading={savingLink} onClick={saveLink}>
            Save
          </Button>
        </div>

        <div className="flex items-end gap-2">
          <Input
            label="Reward per platform share"
            type="number"
            value={rewardAmount}
            onChange={(e) => setRewardAmount(e.target.value)}
          />
          <Button size="sm" loading={savingReward} onClick={saveReward}>
            Save
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground/80">Banner / image</label>
          <p className="text-xs text-foreground/50">
            Shown as the link preview card when the post is shared, and above the caption on the share page. JPEG,
            PNG, or WebP, under 8MB.
          </p>
          {bannerUrl && (
            <div className="my-1 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded campaign banner */}
              <img src={bannerUrl} alt="Current banner" className="h-28 w-auto rounded-lg border border-border" />
              <Button size="sm" variant="outline" loading={uploadingBanner} onClick={removeBanner}>
                Remove
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
              className="flex-1 text-xs"
            />
            <Button size="sm" loading={uploadingBanner} onClick={uploadBanner}>
              Upload
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

import type { Metadata } from "next";
import { getSetting } from "@/lib/server/settings";
import { ArrowUpRight, Banknote, Mic, Pickaxe } from "lucide-react";

const DEFAULT_CAPTION = "Earn real cash with your voice, daily mining, tasks, and referrals on SureCash Mining!";

async function getCampaign() {
  const [caption, bannerUrl, linkUrl] = await Promise.all([
    getSetting("sponsored_post_caption", DEFAULT_CAPTION),
    getSetting("sponsored_post_banner_url", ""),
    getSetting("sponsored_post_link_url", ""),
  ]);
  return { caption, bannerUrl, linkUrl };
}

export async function generateMetadata(): Promise<Metadata> {
  const { caption, bannerUrl } = await getCampaign();
  return {
    title: "SureCash Mining",
    description: caption,
    openGraph: {
      title: "SureCash Mining",
      description: caption,
      images: bannerUrl ? [{ url: bannerUrl }] : undefined,
    },
    twitter: {
      card: bannerUrl ? "summary_large_image" : "summary",
      title: "SureCash Mining",
      description: caption,
      images: bannerUrl ? [bannerUrl] : undefined,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function SharePage() {
  const { caption, bannerUrl, linkUrl } = await getCampaign();
  const destination = linkUrl || process.env.NEXT_PUBLIC_APP_URL || "/";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md">
        <div className="profile-banner flex flex-col items-center gap-3 px-6 pb-10 pt-14 text-center">
          <div className="flex items-end gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25">
              <Banknote className="h-5 w-5" />
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25">
              <Mic className="h-8 w-8" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25">
              <Pickaxe className="h-5 w-5" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">SureCash Mining</h1>
        </div>

        <div className="flex flex-col gap-4 px-5 py-8">
          {bannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded campaign banner
            <img src={bannerUrl} alt="" className="w-full rounded-2xl" />
          )}
          <p className="text-center text-base font-medium">{caption}</p>
          <a
            href={destination}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 w-full items-center justify-center gap-1.5 rounded-xl gradient-brand text-sm font-bold text-white"
          >
            Continue <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { PaymentGatewaysCard } from "@/components/admin/payment-gateways-card";
import { NotificationsIntegrationsCard } from "@/components/admin/notifications-integrations-card";
import { VoiceVerificationCard } from "@/components/admin/voice-verification-card";
import { SponsoredPostsCard } from "@/components/admin/sponsored-posts-card";

interface Setting {
  key: string;
  value: unknown;
}

const LIVE_SETTING_FIELDS = [
  { key: "withdrawal_min_amount", label: "Withdrawal minimum amount" },
  { key: "withdrawal_fee_percent", label: "Withdrawal fee % (base, before tier discount)" },
  { key: "withdrawal_usdt_network_fee", label: "USDT network fee (flat, on top of %)" },
  { key: "usdt_ngn_rate", label: "USDT → NGN exchange rate" },
];

const GAMIFICATION_SETTING_FIELDS = [
  { key: "mining_base_reward", label: "Mining base reward (before streak/tier bonus)" },
  { key: "referral_signup_bonus", label: "Referral signup bonus" },
];

const WATCH_ADS_SETTING_FIELDS = [
  { key: "watch_ads_reward_amount", label: "Reward per ad watched" },
  { key: "watch_ads_duration_seconds", label: "Ad duration (seconds) required before claiming" },
];

const MANUAL_BANK_FIELDS = [
  { key: "manual_deposit_bank_name", label: "Bank name" },
  { key: "manual_deposit_account_number", label: "Account number" },
  { key: "manual_deposit_account_name", label: "Account name" },
];

const DEPOSIT_METHOD_FIELDS = [
  { key: "deposit_gateway_enabled", label: "Instant (Paystack / Monnify / Korapay / Flutterwave)" },
  { key: "deposit_virtual_account_enabled", label: "Bank transfer (dedicated account number)" },
  { key: "deposit_manual_enabled", label: "Manual (bank transfer + receipt upload)" },
];

const GATEWAY_PROVIDER_FIELDS = [
  { key: "deposit_gateway_paystack_enabled", label: "Paystack" },
  { key: "deposit_gateway_monnify_enabled", label: "Monnify" },
  { key: "deposit_gateway_korapay_enabled", label: "Korapay" },
  { key: "deposit_gateway_flutterwave_enabled", label: "Flutterwave" },
];

const SOCIAL_LINK_FIELDS = [
  { key: "social_whatsapp_url", label: "WhatsApp group/channel link" },
  { key: "social_telegram_url", label: "Telegram channel link" },
  { key: "business_whatsapp_url", label: "Business inquiries WhatsApp link (\"Partner with us\" button on the homepage)" },
];

const TABS = [
  { key: "general", label: "General" },
  { key: "payments", label: "Payments" },
  { key: "features", label: "Features" },
  { key: "integrations", label: "Integrations" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loginAlertsEnabled, setLoginAlertsEnabled] = useState(true);
  const [loginAlertsLoading, setLoginAlertsLoading] = useState(false);
  const [tab, setTab] = useState<TabKey>("general");

  useEffect(() => {
    apiFetch<{ settings: Setting[] }>("/api/admin/settings").then((res) => {
      const map: Record<string, string> = {};
      for (const s of res.settings) map[s.key] = String(s.value);
      setSettings(map);
    });
    apiFetch<{ user: { role: string } }>("/api/auth/me").then((res) => setRole(res.user.role));
    apiFetch<{ loginAlertsEnabled: boolean }>("/api/profile/notification-settings")
      .then((res) => setLoginAlertsEnabled(res.loginAlertsEnabled))
      .catch(() => {});
  }, []);

  async function toggleLoginAlerts(checked: boolean) {
    setLoginAlertsLoading(true);
    try {
      await apiFetch("/api/profile/notification-settings", {
        method: "PATCH",
        body: JSON.stringify({ loginAlertsEnabled: checked }),
      });
      setLoginAlertsEnabled(checked);
      toast.success(checked ? "Login alerts enabled" : "Login alerts disabled");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update login alerts");
    } finally {
      setLoginAlertsLoading(false);
    }
  }

  async function save(key: string) {
    const raw = settings[key] ?? "";
    const numeric = Number(raw);
    if (raw !== "" && Number.isNaN(numeric)) {
      return toast.error("Enter a valid number");
    }

    setLoading(key);
    try {
      await apiFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ key, value: raw === "" ? "" : numeric }),
      });
      toast.success(`${key.replaceAll("_", " ")} updated`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save setting");
    } finally {
      setLoading(null);
    }
  }

  async function saveBool(key: string, value: boolean) {
    setSettings({ ...settings, [key]: String(value) });
    setLoading(key);
    try {
      await apiFetch("/api/admin/settings", { method: "PUT", body: JSON.stringify({ key, value }) });
      toast.success(`${key.replaceAll("_", " ")} updated`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save setting");
    } finally {
      setLoading(null);
    }
  }

  async function saveText(key: string) {
    const value = (settings[key] ?? "").trim();
    if (!value) return toast.error("This field can't be empty");

    setLoading(key);
    try {
      await apiFetch("/api/admin/settings", { method: "PUT", body: JSON.stringify({ key, value }) });
      toast.success(`${key.replaceAll("_", " ")} updated`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save setting");
    } finally {
      setLoading(null);
    }
  }

  // Same as saveText but allows an empty value - used for fields where
  // "empty" is a meaningful state (hide the social button, clear the
  // pinned announcement) rather than a mistake to block.
  async function saveOptionalText(key: string) {
    const value = (settings[key] ?? "").trim();
    setLoading(key);
    try {
      await apiFetch("/api/admin/settings", { method: "PUT", body: JSON.stringify({ key, value }) });
      toast.success(value ? `${key.replaceAll("_", " ")} updated` : `${key.replaceAll("_", " ")} cleared`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save setting");
    } finally {
      setLoading(null);
    }
  }

  async function uploadLogo() {
    if (!logoFile) return toast.error("Choose an image first");
    setUploadingLogo(true);
    try {
      const form = new FormData();
      form.append("logo", logoFile);
      const res = await apiFetch<{ logoUrl: string }>("/api/admin/settings/logo", { method: "POST", body: form, headers: {} });
      setSettings({ ...settings, site_logo_url: res.logoUrl });
      setLogoFile(null);
      toast.success("Logo updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not upload logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function removeLogo() {
    setUploadingLogo(true);
    try {
      await apiFetch("/api/admin/settings/logo", { method: "DELETE" });
      setSettings({ ...settings, site_logo_url: "" });
      toast.success("Logo removed");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not remove logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="flex gap-2 overflow-x-auto rounded-xl bg-surface-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-none rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              tab === t.key ? "bg-surface shadow text-brand-primary" : "text-foreground/50"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>My notifications</CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-foreground/50">
          Personal to your own admin account - doesn&apos;t affect other admins or regular users.
        </p>
        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={loginAlertsEnabled}
            disabled={loginAlertsLoading}
            onChange={(e) => toggleLoginAlerts(e.target.checked)}
          />
          Email me when my account is signed in to
        </label>
      </Card>
        </>
      )}

      {tab === "payments" && (
        <>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Withdrawal configuration</CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-foreground/50">
          These take effect live (cached up to 30s) — read directly on every withdrawal request in
          <code className="mx-1 rounded bg-surface-muted px-1">src/lib/server/withdrawal-fee.ts</code>.
        </p>
        <div className="flex flex-col gap-3">
          {LIVE_SETTING_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-end gap-2">
              <Input
                label={label}
                type="number"
                value={settings[key] ?? ""}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
              />
              <Button size="sm" loading={loading === key} onClick={() => save(key)}>
                Save
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Deposit methods</CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-foreground/50">
          Turn a method off to hide its tab on Fund Wallet for everyone — e.g. switch off Instant and Bank
          transfer to run on Manual only while you&apos;re not using automatic payment gateways.
        </p>
        <div className="flex flex-col gap-2.5">
          {DEPOSIT_METHOD_FIELDS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={settings[key] !== "false"}
                disabled={loading === key}
                onChange={(e) => saveBool(key, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Instant funding providers</CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-foreground/50">
          Choose which gateways show up as buttons on the Instant tab. Turning all of them off is the same as
          switching Instant off entirely above.
        </p>
        <div className="flex flex-col gap-2.5">
          {GATEWAY_PROVIDER_FIELDS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={settings[key] !== "false"}
                disabled={loading === key}
                onChange={(e) => saveBool(key, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Manual deposit bank account</CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-foreground/50">
          Shown to users on the &quot;Manual&quot; tab of Fund Wallet when instant gateways are down. Leave any
          field empty and that tab stays disabled for users.
        </p>
        <div className="flex flex-col gap-3">
          {MANUAL_BANK_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-end gap-2">
              <Input
                label={label}
                value={settings[key] ?? ""}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
              />
              <Button size="sm" loading={loading === key} onClick={() => saveText(key)}>
                Save
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {role === "SUPERADMIN" && <PaymentGatewaysCard />}
        </>
      )}

      {tab === "features" && (
        <>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Mining & referral configuration</CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-foreground/50">
          Also live — read directly by
          <code className="mx-1 rounded bg-surface-muted px-1">/api/mining/claim</code>,
          <code className="mx-1 rounded bg-surface-muted px-1">/api/mining/status</code>, and
          <code className="mx-1 rounded bg-surface-muted px-1">/api/auth/register</code>.
        </p>
        <div className="flex flex-col gap-3">
          {GAMIFICATION_SETTING_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-end gap-2">
              <Input
                label={label}
                type="number"
                value={settings[key] ?? ""}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
              />
              <Button size="sm" loading={loading === key} onClick={() => save(key)}>
                Save
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Watch Ads to Earn</CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-foreground/50">
          Also live — read directly by <code className="mx-1 rounded bg-surface-muted px-1">/api/ads</code> and{" "}
          <code className="mx-1 rounded bg-surface-muted px-1">/api/ads/watch</code>. No real ad network is wired up
          yet - users watch a timed placeholder countdown, so this is safe to use as-is or swap for a real rewarded-ad
          SDK later.
        </p>
        <div className="flex flex-col gap-3">
          {WATCH_ADS_SETTING_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-end gap-2">
              <Input
                label={label}
                type="number"
                value={settings[key] ?? ""}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
              />
              <Button size="sm" loading={loading === key} onClick={() => save(key)}>
                Save
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Plan requirement</CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-foreground/50">
          Off by default: anyone can mine, do Voice Tasks (incl. Word Game), Task Center, and Sponsored Posts at
          base rates, and activating a plan just boosts their rate. Turn this on to block all four until a user
          activates a plan - the dashboard, Ways to Earn, and each activity page will prompt them to upgrade.
        </p>
        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={settings.require_active_plan === "true"}
            disabled={loading === "require_active_plan"}
            onChange={(e) => saveBool("require_active_plan", e.target.checked)}
          />
          Require an active plan to mine, do Voice Tasks, Task Center &amp; Sponsored Posts
        </label>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Identity verification (KYC)</CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-foreground/50">
          Off by default. When off, the &quot;Identity Verification&quot; option is hidden from users who haven&apos;t
          submitted anything yet (existing submissions/statuses stay visible to whoever already has one). Turn this
          on to let users upload a document from Profile and have it appear in Admin &gt; KYC Review.
        </p>
        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={settings.kyc_enabled === "true"}
            disabled={loading === "kyc_enabled"}
            onChange={(e) => saveBool("kyc_enabled", e.target.checked)}
          />
          Enable identity verification (KYC) for users
        </label>
      </Card>

      <SponsoredPostsCard />
        </>
      )}

      {tab === "general" && (
        <>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Site logo</CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-foreground/50">
          Shown at the top center of the landing, login, and register pages. JPEG, PNG, WebP, or SVG, under 8MB. If
          uploading an iPhone photo, make sure it&apos;s not in HEIC format (convert to JPG first, or take a
          screenshot of it).
        </p>
        {settings.site_logo_url && (
          <div className="mb-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded logo, arbitrary external-ish source */}
            <img src={settings.site_logo_url} alt="Current logo" className="h-28 w-auto rounded-lg border border-border" />
            <Button size="sm" variant="outline" loading={uploadingLogo} onClick={removeLogo}>
              Remove
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            className="flex-1 text-xs"
          />
          <Button size="sm" loading={uploadingLogo} onClick={uploadLogo}>
            Upload
          </Button>
        </div>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Social links</CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-foreground/50">
          Shown as buttons in the user side menu. Leave a field empty to hide that button.
        </p>
        <div className="flex flex-col gap-3">
          {SOCIAL_LINK_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-end gap-2">
              <Input
                label={label}
                placeholder="https://..."
                value={settings[key] ?? ""}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
              />
              <Button size="sm" loading={loading === key} onClick={() => saveOptionalText(key)}>
                Save
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Company info</CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-foreground/50">
          Shown in the homepage footer. Leave the RC number empty to hide it until CAC registration is complete.
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-2">
            <Input
              label="RC number"
              placeholder="e.g. 1234567"
              value={settings.company_rc_number ?? ""}
              onChange={(e) => setSettings({ ...settings, company_rc_number: e.target.value })}
            />
            <Button size="sm" loading={loading === "company_rc_number"} onClick={() => saveOptionalText("company_rc_number")}>
              Save
            </Button>
          </div>
          <div className="flex items-end gap-2">
            <Input
              label="Office address"
              value={settings.company_office_address ?? ""}
              onChange={(e) => setSettings({ ...settings, company_office_address: e.target.value })}
            />
            <Button
              size="sm"
              loading={loading === "company_office_address"}
              onClick={() => saveOptionalText("company_office_address")}
            >
              Save
            </Button>
          </div>
        </div>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Pinned announcement</CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-foreground/50">
          Shows as a banner at the top of every user&apos;s dashboard. Clear it (save empty) to take it down once the
          information is no longer relevant.
        </p>
        <div className="flex items-end gap-2">
          <Input
            label="Message"
            placeholder="e.g. Scheduled maintenance tonight from 11pm-1am"
            value={settings.pinned_announcement ?? ""}
            onChange={(e) => setSettings({ ...settings, pinned_announcement: e.target.value })}
          />
          <Button size="sm" loading={loading === "pinned_announcement"} onClick={() => saveOptionalText("pinned_announcement")}>
            Save
          </Button>
        </div>
      </Card>
        </>
      )}

      {tab === "integrations" && (
        <>
          {role === "SUPERADMIN" ? (
            <>
              <NotificationsIntegrationsCard />
              <VoiceVerificationCard />
            </>
          ) : (
            <p className="text-sm text-foreground/50">Only super admins can view integration settings.</p>
          )}
        </>
      )}
    </div>
  );
}

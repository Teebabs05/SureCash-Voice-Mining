"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Smartphone, ShieldAlert, History, Monitor, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";

interface Me {
  user: { twoFactorEnabled?: boolean; phone?: string | null; phoneVerified?: boolean };
}
interface Device {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  isTrusted: boolean;
  isVpnSuspected: boolean;
  lastSeenAt: string;
}
interface LoginEvent {
  id: string;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}
interface Session {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastSeenAt: string;
  isCurrent: boolean;
}

export default function SecurityPage() {
  const router = useRouter();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [devices, setDevices] = useState<Device[]>([]);
  const [logins, setLogins] = useState<LoginEvent[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [loading, setLoading] = useState(false);
  const [sessionBusyId, setSessionBusyId] = useState<string | null>(null);

  function loadSessions() {
    apiFetch<{ sessions: Session[] }>("/api/security/sessions").then((res) => setSessions(res.sessions));
  }

  useEffect(() => {
    apiFetch<Me>("/api/auth/me").then((res) => {
      setTwoFactorEnabled(Boolean(res.user.twoFactorEnabled));
      setPhoneVerified(Boolean(res.user.phoneVerified));
      setPhone(res.user.phone ?? "");
    });
    apiFetch<{ devices: Device[] }>("/api/devices").then((res) => setDevices(res.devices));
    apiFetch<{ logins: LoginEvent[] }>("/api/security/login-history").then((res) => setLogins(res.logins));
    loadSessions();
  }, []);

  async function revokeSession(id: string) {
    setSessionBusyId(id);
    try {
      await apiFetch(`/api/security/sessions/${id}/revoke`, { method: "POST" });
      toast.success("Session signed out");
      loadSessions();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not revoke session");
    } finally {
      setSessionBusyId(null);
    }
  }

  async function revokeOtherSessions() {
    setLoading(true);
    try {
      const res = await apiFetch<{ revokedCount: number }>("/api/security/sessions/revoke-others", { method: "POST" });
      toast.success(`Signed out ${res.revokedCount} other session(s)`);
      loadSessions();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not revoke sessions");
    } finally {
      setLoading(false);
    }
  }

  async function sendPhoneOtp() {
    setLoading(true);
    try {
      await apiFetch("/api/security/phone/send-otp", { method: "POST", body: JSON.stringify({ phone }) });
      toast.success("Verification code sent");
      setPhoneOtpSent(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyPhone() {
    setLoading(true);
    try {
      await apiFetch("/api/security/phone/verify", { method: "POST", body: JSON.stringify({ code: phoneOtp }) });
      toast.success("Phone verified");
      setPhoneVerified(true);
      setPhoneOtpSent(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  async function toggle2fa() {
    setLoading(true);
    try {
      await apiFetch(`/api/security/2fa/${twoFactorEnabled ? "disable" : "enable"}`, { method: "POST" });
      setTwoFactorEnabled(!twoFactorEnabled);
      toast.success(twoFactorEnabled ? "2FA disabled" : "2FA enabled");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update 2FA");
    } finally {
      setLoading(false);
    }
  }

  async function changePassword() {
    setLoading(true);
    try {
      await apiFetch("/api/security/change-password", { method: "POST", body: JSON.stringify(passwords) });
      toast.success("Password updated");
      setPasswords({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not change password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-foreground/60">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-xl font-bold">Security</h1>

      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Two-factor authentication</p>
          <p className="text-xs text-foreground/50">Get an email code at every login</p>
        </div>
        <Button size="sm" variant={twoFactorEnabled ? "danger" : "primary"} loading={loading} onClick={toggle2fa}>
          {twoFactorEnabled ? "Disable" : "Enable"}
        </Button>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phone verification</CardTitle>
        </CardHeader>
        {phoneVerified ? (
          <p className="text-sm text-brand-green">✓ {phone} is verified</p>
        ) : (
          <div className="flex flex-col gap-2">
            <Input placeholder="+2348012345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
            {!phoneOtpSent ? (
              <Button loading={loading} onClick={sendPhoneOtp}>
                Send verification code
              </Button>
            ) : (
              <div className="flex gap-2">
                <Input placeholder="Code" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} />
                <Button loading={loading} onClick={verifyPhone}>
                  Verify
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <div className="flex flex-col gap-3">
          <Input
            label="Current password"
            type="password"
            value={passwords.currentPassword}
            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
          />
          <Input
            label="New password"
            type="password"
            value={passwords.newPassword}
            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
          />
          <Button loading={loading} onClick={changePassword}>
            Update password
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active sessions</CardTitle>
          {sessions.length > 1 && (
            <Button size="sm" variant="outline" loading={loading} onClick={revokeOtherSessions}>
              <LogOut className="h-3.5 w-3.5" /> Sign out others
            </Button>
          )}
        </CardHeader>
        <div className="flex flex-col divide-y divide-border">
          {sessions.length === 0 && <p className="py-4 text-center text-sm text-foreground/50">No active sessions</p>}
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 flex-none text-foreground/40" />
                <div>
                  <p className="max-w-[180px] truncate text-xs font-medium">
                    {s.userAgent ?? "Unknown device"} {s.isCurrent && <span className="text-brand-green">(this device)</span>}
                  </p>
                  <p className="text-[10px] text-foreground/40">
                    {s.ipAddress ?? "unknown IP"} · last active {new Date(s.lastSeenAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {!s.isCurrent && (
                <Button size="sm" variant="ghost" loading={sessionBusyId === s.id} onClick={() => revokeSession(s.id)}>
                  Sign out
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bank accounts</CardTitle>
        </CardHeader>
        <p className="text-sm text-foreground/60">
          Manage payout destinations from the{" "}
          <button className="font-medium text-brand-purple" onClick={() => router.push("/wallet/withdraw")}>
            withdraw page
          </button>
          .
        </p>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Devices</CardTitle>
        </CardHeader>
        <div className="flex flex-col divide-y divide-border">
          {devices.length === 0 && <p className="py-4 text-center text-sm text-foreground/50">No devices yet</p>}
          {devices.map((d) => (
            <div key={d.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-foreground/40" />
                <div>
                  <p className="max-w-[200px] truncate text-xs">{d.userAgent ?? "Unknown device"}</p>
                  <p className="text-[10px] text-foreground/40">{new Date(d.lastSeenAt).toLocaleString()}</p>
                </div>
              </div>
              {d.isVpnSuspected && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-red-500">
                  <ShieldAlert className="h-3.5 w-3.5" /> VPN
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Login history</CardTitle>
        </CardHeader>
        <div className="flex flex-col divide-y divide-border">
          {logins.length === 0 && <p className="py-4 text-center text-sm text-foreground/50">No login history yet</p>}
          {logins.map((l) => (
            <div key={l.id} className="flex items-center gap-2 py-3">
              <History className="h-4 w-4 flex-none text-foreground/40" />
              <div>
                <p className="text-xs font-medium">
                  {l.action === "auth.login_failed" ? "Failed login attempt" : "Signed in"} · {l.ipAddress ?? "unknown IP"}
                </p>
                <p className="text-[10px] text-foreground/40">{new Date(l.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

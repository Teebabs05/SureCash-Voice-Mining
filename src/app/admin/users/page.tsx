"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Search, Ban, CheckCircle, Eye, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isBanned: boolean;
  emailVerified: boolean;
  level: number;
  tier: string;
  createdAt: string;
}

const TIERS = ["FREE", "SILVER", "GOLD", "VIP"] as const;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });

  const load = useCallback((query?: string) => {
    apiFetch<{ users: AdminUser[] }>(`/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`).then((res) =>
      setUsers(res.users)
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleBan(user: AdminUser) {
    setBusyId(user.id);
    try {
      await apiFetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isBanned: !user.isBanned }),
      });
      toast.success(user.isBanned ? "User unbanned" : "User banned");
      load(q);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function changeTier(user: AdminUser, tier: string) {
    setBusyId(user.id);
    try {
      await apiFetch(`/api/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ tier }) });
      toast.success(`${user.fullName} moved to ${tier}`);
      load(q);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function createUser() {
    if (!form.fullName || !form.email || form.password.length < 8) {
      return toast.error("Full name, email, and an 8+ character password are required");
    }
    setCreating(true);
    try {
      await apiFetch("/api/admin/users", { method: "POST", body: JSON.stringify(form) });
      toast.success("User created");
      setForm({ fullName: "", email: "", phone: "", password: "" });
      setShowCreate(false);
      load(q);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create user");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Users</h1>

      <div className="flex max-w-sm gap-2">
        <Input placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button variant="outline" onClick={() => load(q)}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Create user</CardTitle>
        </CardHeader>
        {showCreate ? (
          <div className="flex flex-col gap-2">
            <Input placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <Input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              placeholder="Phone (optional)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              placeholder="Password (8+ characters)"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <div className="flex gap-2">
              <Button size="sm" loading={creating} onClick={createUser}>
                Create
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-border py-2.5 text-sm text-brand-primary"
          >
            <Plus className="h-4 w-4" /> New user
          </button>
        )}
      </Card>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted text-xs uppercase text-foreground/50">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium">{u.fullName}</td>
                <td className="px-4 py-3 text-foreground/60">{u.email}</td>
                <td className="px-4 py-3">{u.level}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.tier}
                    disabled={busyId === u.id}
                    onChange={(e) => changeTier(u, e.target.value)}
                    className="rounded-lg border border-border bg-surface px-2 py-1 text-xs"
                  >
                    {TIERS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      u.isBanned ? "bg-red-500/15 text-red-500" : "bg-brand-green/15 text-brand-green"
                    )}
                  >
                    {u.isBanned ? "Banned" : "Active"}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground/50">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link href={`/admin/users/${u.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant={u.isBanned ? "outline" : "danger"}
                      loading={busyId === u.id}
                      onClick={() => toggleBan(u)}
                    >
                      {u.isBanned ? <CheckCircle className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                      {u.isBanned ? "Unban" : "Ban"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

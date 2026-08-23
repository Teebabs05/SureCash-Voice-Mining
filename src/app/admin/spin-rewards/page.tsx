"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, RotateCcw, Trash2, Pencil } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

interface SpinReward {
  id: string;
  label: string;
  amount: string;
  wallet: "MAIN" | "ENGAGEMENT" | "SALES";
  weight: number;
  colorHex: string;
  isActive: boolean;
}

const WALLETS = ["MAIN", "ENGAGEMENT", "SALES"] as const;

interface RewardForm {
  label: string;
  amount: string;
  wallet: SpinReward["wallet"];
  weight: string;
  colorHex: string;
}

const emptyForm: RewardForm = { label: "", amount: "", wallet: "ENGAGEMENT", weight: "0", colorHex: "#0D8A82" };

export default function AdminSpinRewardsPage() {
  const [rewards, setRewards] = useState<SpinReward[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [priceSaving, setPriceSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const loadRewards = useCallback(() => {
    apiFetch<{ rewards: SpinReward[] }>("/api/admin/spin-rewards").then((res) => setRewards(res.rewards));
  }, []);

  useEffect(() => {
    loadRewards();
    apiFetch<{ settings: { key: string; value: unknown }[] }>("/api/admin/settings").then((res) => {
      const map: Record<string, string> = {};
      for (const s of res.settings) map[s.key] = String(s.value);
      setSettings(map);
    });
  }, [loadRewards]);

  async function savePrice() {
    const numeric = Number(settings.spin_extra_spin_price);
    if (!settings.spin_extra_spin_price || Number.isNaN(numeric) || numeric < 0) {
      return toast.error("Enter a valid price");
    }
    setPriceSaving(true);
    try {
      await apiFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ key: "spin_extra_spin_price", value: numeric }),
      });
      toast.success("Extra spin price updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save price");
    } finally {
      setPriceSaving(false);
    }
  }

  async function createReward() {
    try {
      await apiFetch("/api/admin/spin-rewards", {
        method: "POST",
        body: JSON.stringify({
          label: form.label,
          amount: Number(form.amount),
          wallet: form.wallet,
          weight: Number(form.weight),
          colorHex: form.colorHex,
        }),
      });
      toast.success("Reward created");
      setForm(emptyForm);
      setShowForm(false);
      loadRewards();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create reward");
    }
  }

  function startEdit(reward: SpinReward) {
    setEditingId(reward.id);
    setEditForm({
      label: reward.label,
      amount: reward.amount,
      wallet: reward.wallet,
      weight: String(reward.weight),
      colorHex: reward.colorHex,
    });
  }

  async function saveEdit(id: string) {
    setBusyId(id);
    try {
      await apiFetch(`/api/admin/spin-rewards/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          label: editForm.label,
          amount: Number(editForm.amount),
          wallet: editForm.wallet,
          weight: Number(editForm.weight),
          colorHex: editForm.colorHex,
        }),
      });
      toast.success("Reward updated");
      setEditingId(null);
      loadRewards();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update reward");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(reward: SpinReward) {
    setBusyId(reward.id);
    try {
      await apiFetch(`/api/admin/spin-rewards/${reward.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !reward.isActive }),
      });
      loadRewards();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteReward(reward: SpinReward) {
    setBusyId(reward.id);
    try {
      const res = await apiFetch<{ hardDeleted: boolean; message?: string }>(`/api/admin/spin-rewards/${reward.id}`, {
        method: "DELETE",
      });
      toast.success(res.hardDeleted ? "Reward deleted" : res.message ?? "Reward deactivated");
      loadRewards();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function resetDefaults() {
    if (!confirm("Reset the wheel to the recommended defaults? This deactivates any custom rewards not in the default set.")) {
      return;
    }
    setResetting(true);
    try {
      await apiFetch("/api/admin/spin-rewards/reset-defaults", { method: "POST" });
      toast.success("Spin wheel reset to defaults");
      loadRewards();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not reset defaults");
    } finally {
      setResetting(false);
    }
  }

  const active = rewards.filter((r) => r.isActive);
  const totalWeight = active.reduce((sum, r) => sum + r.weight, 0);
  const winWeight = active.filter((r) => Number(r.amount) > 0).reduce((sum, r) => sum + r.weight, 0);
  const winChance = totalWeight > 0 ? ((winWeight / totalWeight) * 100).toFixed(1) : "0.0";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Spin Wheel</h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Extra spin price</CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-foreground/50">
          Everyone gets one free spin a day. After that, this is what an extra spin costs from their main wallet
          balance.
        </p>
        <div className="flex items-end gap-2">
          <Input
            label="Price"
            type="number"
            value={settings.spin_extra_spin_price ?? ""}
            onChange={(e) => setSettings({ ...settings, spin_extra_spin_price: e.target.value })}
          />
          <Button size="sm" loading={priceSaving} onClick={savePrice}>
            Save
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reward weights</CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-foreground/50">
          Each reward&apos;s chance of being landed on is its weight divided by the total weight of all active rewards.
          Set a reward&apos;s weight to 0 so it shows on the wheel but can never actually be won.
        </p>
        <p className="mb-3 rounded-lg bg-surface-muted px-3 py-2 text-xs font-semibold text-brand-primary">
          Current odds: {winChance}% chance to win something on any given spin
        </p>

        <div className="flex flex-col gap-2">
          {rewards.map((r) =>
            editingId === r.id ? (
              <div key={r.id} className="flex flex-col gap-2 rounded-xl bg-surface-muted p-3">
                <Input placeholder="Label" value={editForm.label} onChange={(e) => setEditForm({ ...editForm, label: e.target.value })} />
                <div className="flex gap-2">
                  <Input
                    placeholder="Amount"
                    type="number"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  />
                  <Input
                    placeholder="Weight"
                    type="number"
                    value={editForm.weight}
                    onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={editForm.wallet}
                    onChange={(e) => setEditForm({ ...editForm, wallet: e.target.value as SpinReward["wallet"] })}
                    className="h-11 flex-1 rounded-xl border border-border bg-surface px-3.5 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                  >
                    {WALLETS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                  <input
                    type="color"
                    value={editForm.colorHex}
                    onChange={(e) => setEditForm({ ...editForm, colorHex: e.target.value })}
                    className="h-11 w-14 rounded-xl border border-border bg-surface"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" loading={busyId === r.id} onClick={() => saveEdit(r.id)}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted p-3">
                <div className="flex items-center gap-3">
                  <span className="h-6 w-6 flex-none rounded-full border border-border" style={{ background: r.colorHex }} />
                  <div>
                    <p className="text-sm font-semibold">
                      {r.label} {!r.isActive && <span className="text-xs text-foreground/40">(inactive)</span>}
                    </p>
                    <p className="text-xs text-foreground/50">
                      {formatCurrency(r.amount)} · weight {r.weight} · {r.wallet}
                    </p>
                  </div>
                </div>
                <div className="flex flex-none gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(r)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant={r.isActive ? "outline" : "primary"}
                    loading={busyId === r.id}
                    onClick={() => toggleActive(r)}
                  >
                    {r.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="danger" loading={busyId === r.id} onClick={() => deleteReward(r)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          )}
        </div>

        {showForm ? (
          <div className="mt-3 flex flex-col gap-2">
            <Input placeholder="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            <div className="flex gap-2">
              <Input
                placeholder="Amount"
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
              <Input
                placeholder="Weight"
                type="number"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={form.wallet}
                onChange={(e) => setForm({ ...form, wallet: e.target.value as SpinReward["wallet"] })}
                className="h-11 flex-1 rounded-xl border border-border bg-surface px-3.5 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              >
                {WALLETS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
              <input
                type="color"
                value={form.colorHex}
                onChange={(e) => setForm({ ...form, colorHex: e.target.value })}
                className="h-11 w-14 rounded-xl border border-border bg-surface"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createReward}>Create reward</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-border py-2.5 text-sm text-brand-primary"
          >
            <Plus className="h-4 w-4" /> New reward
          </button>
        )}

        <button
          onClick={resetDefaults}
          disabled={resetting}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-sm text-foreground/60 disabled:opacity-50"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset to recommended defaults (10% win chance, 500/1000 unwinnable)
        </button>
      </Card>
    </div>
  );
}

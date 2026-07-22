"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";

interface Plan {
  id: string;
  name: string;
  price: string;
  voiceSessionReward: string;
  wordGameReward: string;
  sponsoredPostReward: string;
  taskReward: string;
  referralCommission: string;
  sortOrder: number;
  isActive: boolean;
  isPopular: boolean;
  voiceEarnDailyLimit: number;
  wordGameDailyLimit: number;
  taskCenterDailyLimit: number;
  sponsoredPostsDailyLimit: number;
  spinDailyLimit: number;
}

const FIELDS: Array<{ key: keyof Plan; label: string }> = [
  { key: "name", label: "Name" },
  { key: "price", label: "Price" },
  { key: "voiceSessionReward", label: "Per Voice Earn session" },
  { key: "wordGameReward", label: "Per Word Game" },
  { key: "sponsoredPostReward", label: "Per Sponsored Post" },
  { key: "taskReward", label: "Per task" },
  { key: "referralCommission", label: "Referral commission" },
];

const DAILY_LIMIT_FIELDS: Array<{
  key: "voiceEarnDailyLimit" | "wordGameDailyLimit" | "taskCenterDailyLimit" | "sponsoredPostsDailyLimit" | "spinDailyLimit";
  label: string;
}> = [
  { key: "voiceEarnDailyLimit", label: "Voice Earn /day (per language)" },
  { key: "wordGameDailyLimit", label: "Word Game /day" },
  { key: "taskCenterDailyLimit", label: "Task Center /day" },
  { key: "sponsoredPostsDailyLimit", label: "Sponsored Posts /day" },
  { key: "spinDailyLimit", label: "Lucky Spin /day" },
];

const NEW_PLAN_DEFAULTS = {
  name: "",
  price: "",
  voiceSessionReward: "",
  wordGameReward: "",
  sponsoredPostReward: "",
  taskReward: "",
  referralCommission: "",
  sortOrder: "0",
  isPopular: false,
  voiceEarnDailyLimit: "9999",
  wordGameDailyLimit: "9999",
  taskCenterDailyLimit: "9999",
  sponsoredPostsDailyLimit: "9999",
  spinDailyLimit: "9999",
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editing, setEditing] = useState<Record<string, Record<string, string>>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(NEW_PLAN_DEFAULTS);

  const load = useCallback(() => {
    apiFetch<{ plans: Plan[] }>("/api/admin/plans").then((res) => {
      setPlans(res.plans);
      setEditing(
        Object.fromEntries(
          res.plans.map((p) => [
            p.id,
            {
              name: p.name,
              price: p.price,
              voiceSessionReward: p.voiceSessionReward,
              wordGameReward: p.wordGameReward,
              sponsoredPostReward: p.sponsoredPostReward,
              taskReward: p.taskReward,
              referralCommission: p.referralCommission,
              voiceEarnDailyLimit: String(p.voiceEarnDailyLimit),
              wordGameDailyLimit: String(p.wordGameDailyLimit),
              taskCenterDailyLimit: String(p.taskCenterDailyLimit),
              sponsoredPostsDailyLimit: String(p.sponsoredPostsDailyLimit),
              spinDailyLimit: String(p.spinDailyLimit),
            },
          ])
        )
      );
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(plan: Plan) {
    setBusyId(plan.id);
    try {
      const values = editing[plan.id];
      await apiFetch(`/api/admin/plans/${plan.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: values.name,
          price: Number(values.price),
          voiceSessionReward: Number(values.voiceSessionReward),
          wordGameReward: Number(values.wordGameReward),
          sponsoredPostReward: Number(values.sponsoredPostReward),
          taskReward: Number(values.taskReward),
          referralCommission: Number(values.referralCommission),
          voiceEarnDailyLimit: Number(values.voiceEarnDailyLimit),
          wordGameDailyLimit: Number(values.wordGameDailyLimit),
          taskCenterDailyLimit: Number(values.taskCenterDailyLimit),
          sponsoredPostsDailyLimit: Number(values.sponsoredPostsDailyLimit),
          spinDailyLimit: Number(values.spinDailyLimit),
        }),
      });
      toast.success("Plan updated");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update plan");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(plan: Plan) {
    setBusyId(plan.id);
    try {
      await apiFetch(`/api/admin/plans/${plan.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !plan.isActive }) });
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function togglePopular(plan: Plan) {
    setBusyId(plan.id);
    try {
      await apiFetch(`/api/admin/plans/${plan.id}`, { method: "PATCH", body: JSON.stringify({ isPopular: !plan.isPopular }) });
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function createPlan() {
    try {
      await apiFetch("/api/admin/plans", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          price: Number(form.price),
          voiceSessionReward: Number(form.voiceSessionReward),
          wordGameReward: Number(form.wordGameReward),
          sponsoredPostReward: Number(form.sponsoredPostReward),
          taskReward: Number(form.taskReward),
          referralCommission: Number(form.referralCommission),
          sortOrder: Number(form.sortOrder),
          isPopular: form.isPopular,
          voiceEarnDailyLimit: Number(form.voiceEarnDailyLimit),
          wordGameDailyLimit: Number(form.wordGameDailyLimit),
          taskCenterDailyLimit: Number(form.taskCenterDailyLimit),
          sponsoredPostsDailyLimit: Number(form.sponsoredPostsDailyLimit),
          spinDailyLimit: Number(form.spinDailyLimit),
        }),
      });
      toast.success("Plan created");
      setForm(NEW_PLAN_DEFAULTS);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create plan");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Plans</h1>
      <p className="-mt-4 text-sm text-foreground/60">
        Edit price and per-activity rewards live - changes apply to new activations and future task rewards
        immediately. Every plan can access every activity; the daily limit fields control how many completions
        per day each plan allows in that section (use 9999 for effectively unlimited).
      </p>

      {plans.map((plan) => (
        <Card key={plan.id}>
          <CardHeader>
            <CardTitle>
              {plan.name} {!plan.isActive && <span className="text-xs text-red-500">(inactive)</span>}{" "}
              {plan.isPopular && <span className="text-xs text-brand-primary">(popular)</span>}
            </CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map(({ key, label }) => (
              <Input
                key={key}
                label={label}
                value={editing[plan.id]?.[key] ?? ""}
                onChange={(e) => setEditing({ ...editing, [plan.id]: { ...editing[plan.id], [key]: e.target.value } })}
              />
            ))}
          </div>

          <div className="mt-3">
            <p className="mb-1.5 text-xs font-semibold text-foreground/50">Daily completion limits per section</p>
            <div className="grid grid-cols-2 gap-3">
              {DAILY_LIMIT_FIELDS.map(({ key, label }) => (
                <Input
                  key={key}
                  label={label}
                  type="number"
                  value={editing[plan.id]?.[key] ?? ""}
                  onChange={(e) => setEditing({ ...editing, [plan.id]: { ...editing[plan.id], [key]: e.target.value } })}
                />
              ))}
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <Button size="sm" loading={busyId === plan.id} onClick={() => save(plan)}>
              Save changes
            </Button>
            <Button size="sm" variant="outline" loading={busyId === plan.id} onClick={() => toggleActive(plan)}>
              {plan.isActive ? "Deactivate" : "Activate"}
            </Button>
            <Button
              size="sm"
              variant={plan.isPopular ? "primary" : "outline"}
              loading={busyId === plan.id}
              onClick={() => togglePopular(plan)}
            >
              {plan.isPopular ? "Popular ✓" : "Mark popular"}
            </Button>
          </div>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>New plan</CardTitle>
        </CardHeader>
        {showForm ? (
          <div className="flex flex-col gap-2">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input
              placeholder="Price"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <Input
              placeholder="Per Voice Earn session"
              type="number"
              value={form.voiceSessionReward}
              onChange={(e) => setForm({ ...form, voiceSessionReward: e.target.value })}
            />
            <Input
              placeholder="Per Word Game"
              type="number"
              value={form.wordGameReward}
              onChange={(e) => setForm({ ...form, wordGameReward: e.target.value })}
            />
            <Input
              placeholder="Per Sponsored Post"
              type="number"
              value={form.sponsoredPostReward}
              onChange={(e) => setForm({ ...form, sponsoredPostReward: e.target.value })}
            />
            <Input
              placeholder="Per task"
              type="number"
              value={form.taskReward}
              onChange={(e) => setForm({ ...form, taskReward: e.target.value })}
            />
            <Input
              placeholder="Referral commission"
              type="number"
              value={form.referralCommission}
              onChange={(e) => setForm({ ...form, referralCommission: e.target.value })}
            />
            <Input
              placeholder="Sort order"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
            <label className="flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={form.isPopular}
                onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
              />
              Mark as popular
            </label>
            <div>
              <p className="mb-1.5 text-xs font-semibold text-foreground/50">
                Daily completion limits per section (9999 = effectively unlimited)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DAILY_LIMIT_FIELDS.map(({ key, label }) => (
                  <Input
                    key={key}
                    placeholder={label}
                    type="number"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                ))}
              </div>
            </div>
            <Button onClick={createPlan}>Create plan</Button>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-border py-2.5 text-sm text-brand-primary"
          >
            <Plus className="h-4 w-4" /> New plan
          </button>
        )}
      </Card>
    </div>
  );
}

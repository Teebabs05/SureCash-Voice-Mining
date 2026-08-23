"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

interface MiningPlan {
  id: string;
  name: string;
  price: string;
  dailyReturn: string;
  durationDays: number;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

const EMPTY_FORM = {
  name: "",
  price: "",
  dailyReturn: "",
  durationDays: "30",
  description: "",
  sortOrder: "0",
};

export default function AdminMiningPlansPage() {
  const [plans, setPlans] = useState<MiningPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    apiFetch<{ plans: MiningPlan[] }>("/api/admin/mining-plans")
      .then((res) => setPlans(res.plans))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function startEdit(plan: MiningPlan) {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      price: plan.price,
      dailyReturn: plan.dailyReturn,
      durationDays: String(plan.durationDays),
      description: plan.description ?? "",
      sortOrder: String(plan.sortOrder),
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.name.trim()) return toast.error("Enter a plan name");
    if (!form.price || Number(form.price) <= 0) return toast.error("Enter a valid price");
    if (!form.dailyReturn || Number(form.dailyReturn) <= 0) return toast.error("Enter a valid daily return");

    const body = {
      name: form.name.trim(),
      price: Number(form.price),
      dailyReturn: Number(form.dailyReturn),
      durationDays: Number(form.durationDays) || 30,
      description: form.description.trim() || undefined,
      sortOrder: Number(form.sortOrder) || 0,
    };

    setSaving(true);
    try {
      if (editingId) {
        await apiFetch(`/api/admin/mining-plans/${editingId}`, { method: "PATCH", body: JSON.stringify(body) });
        toast.success("Plan updated");
      } else {
        await apiFetch("/api/admin/mining-plans", { method: "POST", body: JSON.stringify(body) });
        toast.success("Plan created");
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save plan");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(plan: MiningPlan) {
    try {
      await apiFetch(`/api/admin/mining-plans/${plan.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !plan.isActive }),
      });
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update plan");
    }
  }

  async function deletePlan(plan: MiningPlan) {
    if (!confirm(`Remove "${plan.name}"? If it has any investments, it'll just be deactivated instead of deleted.`)) return;
    try {
      const res = await apiFetch<{ deactivatedOnly?: boolean }>(`/api/admin/mining-plans/${plan.id}`, { method: "DELETE" });
      toast.success(res.deactivatedOnly ? "Plan deactivated (has existing investments)" : "Plan deleted");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not remove plan");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mining Plans</h1>
        <Button size="sm" onClick={startCreate}>
          <Plus className="h-3.5 w-3.5" /> New plan
        </Button>
      </div>
      <p className="text-sm text-foreground/60">
        Investment-style plans: a user pays the price once and earns the daily return automatically every day for
        the plan&apos;s duration (defaults to 30 days / monthly). Separate from the rate-boost Plans page and the
        free Daily Mining claim.
      </p>

      {showForm && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>{editingId ? "Edit plan" : "New plan"}</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-3">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="flex gap-2">
              <Input
                label="Price (buy-in)"
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              <Input
                label="Daily return"
                type="number"
                value={form.dailyReturn}
                onChange={(e) => setForm({ ...form, dailyReturn: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Input
                label="Duration (days)"
                type="number"
                value={form.durationDays}
                onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
              />
              <Input
                label="Sort order"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              />
            </div>
            <Input
              label="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="flex gap-2">
              <Button size="sm" loading={saving} onClick={save}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading && <p className="text-sm text-foreground/50">Loading…</p>}

      <div className="flex flex-col gap-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">
                {plan.name} {!plan.isActive && <span className="text-xs text-foreground/40">(inactive)</span>}
              </p>
              <p className="text-xs text-foreground/50">
                {formatCurrency(plan.price)} buy-in · {formatCurrency(plan.dailyReturn)}/day · {plan.durationDays} days
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => toggleActive(plan)}>
                {plan.isActive ? "Deactivate" : "Activate"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => startEdit(plan)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="danger" onClick={() => deletePlan(plan)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        ))}
        {!loading && plans.length === 0 && <p className="text-sm text-foreground/50">No mining plans yet.</p>}
      </div>
    </div>
  );
}

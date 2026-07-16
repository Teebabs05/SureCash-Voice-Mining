"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatCurrency, cn } from "@/lib/utils";

interface PromoCode {
  id: string;
  code: string;
  amount: string;
  wallet: string;
  maxRedemptions: number;
  redemptionCount: number;
  isActive: boolean;
}

export default function AdminPromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", amount: "", maxRedemptions: "100" });

  const load = useCallback(() => {
    apiFetch<{ promoCodes: PromoCode[] }>("/api/admin/promo-codes").then((res) => setCodes(res.promoCodes));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create() {
    try {
      await apiFetch("/api/admin/promo-codes", {
        method: "POST",
        body: JSON.stringify({
          code: form.code,
          amount: Number(form.amount),
          maxRedemptions: Number(form.maxRedemptions),
        }),
      });
      toast.success("Promo code created");
      setForm({ code: "", amount: "", maxRedemptions: "100" });
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create promo code");
    }
  }

  async function toggle(code: PromoCode) {
    setBusyId(code.id);
    try {
      await apiFetch(`/api/admin/promo-codes/${code.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !code.isActive }) });
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Promo Codes</h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Active codes</CardTitle>
        </CardHeader>
        <div className="flex flex-col gap-2">
          {codes.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl bg-surface-muted p-3">
              <div>
                <p className="text-sm font-semibold tracking-widest">{c.code}</p>
                <p className="text-xs text-foreground/50">
                  {formatCurrency(c.amount)} · {c.redemptionCount}/{c.maxRedemptions} redeemed
                </p>
              </div>
              <Button
                size="sm"
                variant={c.isActive ? "outline" : "primary"}
                loading={busyId === c.id}
                onClick={() => toggle(c)}
              >
                {c.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          ))}
        </div>

        {showForm ? (
          <div className="mt-3 flex flex-col gap-2">
            <Input placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            <Input placeholder="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Input
              placeholder="Max redemptions"
              type="number"
              value={form.maxRedemptions}
              onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
            />
            <Button onClick={create}>Create code</Button>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className={cn("mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-border py-2.5 text-sm text-brand-primary")}
          >
            <Plus className="h-4 w-4" /> New promo code
          </button>
        )}
      </Card>
    </div>
  );
}

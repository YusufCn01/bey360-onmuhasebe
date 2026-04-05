"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PackagePlanRow = {
  id: string;
  code: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  userLimit: number;
  branchLimit: number;
  isActive: boolean;
  tenantsCount: number;
  applicationsCount: number;
};

const emptyForm = {
  code: "",
  name: "",
  monthlyPrice: "0",
  yearlyPrice: "0",
  userLimit: "1",
  branchLimit: "1",
};

export function PackagePlanManager({ initialPlans }: { initialPlans: PackagePlanRow[] }) {
  const router = useRouter();
  const [newPlan, setNewPlan] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function createPlan() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/kurucu/package-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlan),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.error?.message ?? "Paket oluşturulamadı.");
      }
      setMessage("Yeni paket planı oluşturuldu.");
      setNewPlan(emptyForm);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem başarısız.");
    } finally {
      setLoading(false);
    }
  }

  async function updatePlan(planId: string) {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/kurucu/package-plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingForm),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.error?.message ?? "Paket güncellenemedi.");
      }
      setMessage("Paket planı güncellendi.");
      setEditingId(null);
      setEditingForm({});
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem başarısız.");
    } finally {
      setLoading(false);
    }
  }

  async function deletePlan(planId: string) {
    if (!confirm("Bu paket planı silinsin mi?")) {
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/kurucu/package-plans/${planId}`, { method: "DELETE" });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        throw new Error(body?.error?.message ?? "Paket silinemedi.");
      }
      setMessage("Paket planı silindi.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem başarısız.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3">
        <Field label="Paket kodu" value={newPlan.code} onChange={(value) => setNewPlan((prev) => ({ ...prev, code: value }))} />
        <Field label="Paket adı" value={newPlan.name} onChange={(value) => setNewPlan((prev) => ({ ...prev, name: value }))} />
        <Field label="Aylık fiyat" type="number" value={newPlan.monthlyPrice} onChange={(value) => setNewPlan((prev) => ({ ...prev, monthlyPrice: value }))} />
        <Field label="Yıllık fiyat" type="number" value={newPlan.yearlyPrice} onChange={(value) => setNewPlan((prev) => ({ ...prev, yearlyPrice: value }))} />
        <Field label="Kullanıcı limiti" type="number" value={newPlan.userLimit} onChange={(value) => setNewPlan((prev) => ({ ...prev, userLimit: value }))} />
        <Field label="Şube limiti" type="number" value={newPlan.branchLimit} onChange={(value) => setNewPlan((prev) => ({ ...prev, branchLimit: value }))} />
        <div className="md:col-span-3">
          <button type="button" onClick={createPlan} disabled={loading} className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-black text-white hover:bg-[var(--brand-strong)] disabled:opacity-60">
            {loading ? "Kaydediliyor..." : "Yeni Paket Oluştur"}
          </button>
        </div>
        {message ? <p className="md:col-span-3 text-sm font-semibold text-emerald-600">{message}</p> : null}
        {error ? <p className="md:col-span-3 text-sm font-semibold text-rose-600">{error}</p> : null}
      </div>

      <div className="space-y-4">
        {initialPlans.map((plan) => {
          const isEditing = editingId === plan.id;
          const current = isEditing ? editingForm : {
            code: plan.code,
            name: plan.name,
            monthlyPrice: String(plan.monthlyPrice),
            yearlyPrice: String(plan.yearlyPrice),
            userLimit: String(plan.userLimit),
            branchLimit: String(plan.branchLimit),
            isActive: String(plan.isActive),
          };

          return (
            <article key={plan.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Field label="Kod" value={current.code} disabled={!isEditing} onChange={(value) => setEditingForm((prev) => ({ ...prev, code: value }))} />
                  <Field label="Ad" value={current.name} disabled={!isEditing} onChange={(value) => setEditingForm((prev) => ({ ...prev, name: value }))} />
                  <Field label="Aylık fiyat" type="number" value={current.monthlyPrice} disabled={!isEditing} onChange={(value) => setEditingForm((prev) => ({ ...prev, monthlyPrice: value }))} />
                  <Field label="Yıllık fiyat" type="number" value={current.yearlyPrice} disabled={!isEditing} onChange={(value) => setEditingForm((prev) => ({ ...prev, yearlyPrice: value }))} />
                  <Field label="Kullanıcı limiti" type="number" value={current.userLimit} disabled={!isEditing} onChange={(value) => setEditingForm((prev) => ({ ...prev, userLimit: value }))} />
                  <Field label="Şube limiti" type="number" value={current.branchLimit} disabled={!isEditing} onChange={(value) => setEditingForm((prev) => ({ ...prev, branchLimit: value }))} />
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Info label="Tenant sayısı" value={String(plan.tenantsCount)} />
                    <Info label="Başvuru sayısı" value={String(plan.applicationsCount)} />
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Durum</span>
                    <select
                      value={current.isActive}
                      disabled={!isEditing}
                      onChange={(event) => setEditingForm((prev) => ({ ...prev, isActive: event.target.value }))}
                    >
                      <option value="true">Aktif</option>
                      <option value="false">Pasif</option>
                    </select>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {isEditing ? (
                      <>
                        <button type="button" onClick={() => updatePlan(plan.id)} disabled={loading} className="rounded-xl bg-[var(--brand)] px-4 py-2 text-xs font-black text-white hover:bg-[var(--brand-strong)] disabled:opacity-60">
                          Kaydet
                        </button>
                        <button type="button" onClick={() => { setEditingId(null); setEditingForm({}); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100">
                          Vazgeç
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(plan.id);
                          setEditingForm({
                            code: plan.code,
                            name: plan.name,
                            monthlyPrice: String(plan.monthlyPrice),
                            yearlyPrice: String(plan.yearlyPrice),
                            userLimit: String(plan.userLimit),
                            branchLimit: String(plan.branchLimit),
                            isActive: String(plan.isActive),
                          });
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                      >
                        Düzenle
                      </button>
                    )}
                    <button type="button" onClick={() => deletePlan(plan.id)} disabled={loading} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60">
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <input type={type} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}

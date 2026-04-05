"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PackagePlanOption = {
  id: string;
  name: string;
  code: string;
};

export function TenantPlanActions({
  tenantId,
  currentStatus,
  currentPackagePlanId,
  packagePlans,
}: {
  tenantId: string;
  currentStatus: string;
  currentPackagePlanId: string | null;
  packagePlans: PackagePlanOption[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [packagePlanId, setPackagePlanId] = useState(currentPackagePlanId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/kurucu/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, packagePlanId: packagePlanId || null }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.error?.message ?? "Tenant güncellenemedi.");
      }

      setStatus(body.data.status);
      setPackagePlanId(body.data.packagePlanId ?? "");
      setMessage("Tenant lisans bilgisi güncellendi.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem başarısız.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Durum</span>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="TRIAL">Deneme</option>
          <option value="ACTIVE">Aktif</option>
          <option value="SUSPENDED">Askıda</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Paket planı</span>
        <select value={packagePlanId} onChange={(event) => setPackagePlanId(event.target.value)}>
          <option value="">Plan seçilmedi</option>
          {packagePlans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} ({plan.code})
            </option>
          ))}
        </select>
      </label>

      <button type="button" onClick={save} disabled={loading} className="rounded-xl bg-[var(--brand)] px-4 py-2 text-xs font-black text-white hover:bg-[var(--brand-strong)] disabled:opacity-60">
        {loading ? "Kaydediliyor..." : "Lisansı Güncelle"}
      </button>

      {message ? <p className="text-xs font-semibold text-emerald-600">{message}</p> : null}
      {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}

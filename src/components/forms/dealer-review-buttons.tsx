"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PackagePlanOption = {
  id: string;
  name: string;
  code: string;
};

export function DealerReviewButtons({
  applicationId,
  currentStatus,
  currentCommissionRate,
  currentPackagePlanId,
  packagePlans,
}: {
  applicationId: string;
  currentStatus: string;
  currentCommissionRate: number;
  currentPackagePlanId: string | null;
  packagePlans: PackagePlanOption[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [commissionRate, setCommissionRate] = useState(String(currentCommissionRate));
  const [packagePlanId, setPackagePlanId] = useState(currentPackagePlanId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function save(nextStatus?: "APPROVED" | "REJECTED" | "REVIEWING" | "NEW") {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/kurucu/dealer-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus ?? status,
          commissionRate,
          packagePlanId: packagePlanId || null,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.error?.message ?? "Başvuru güncellenemedi.");
      }

      setStatus(body.data.status);
      setCommissionRate(String(body.data.commissionRate));
      setPackagePlanId(body.data.packagePlanId ?? "");
      setMessage("Bayi başvurusu güncellendi.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem başarısız.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Önerilen paket</span>
        <select value={packagePlanId} onChange={(event) => setPackagePlanId(event.target.value)}>
          <option value="">Paket seçilmedi</option>
          {packagePlans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} ({plan.code})
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Komisyon oranı</span>
        <input type="number" min="0" max="100" step="0.1" value={commissionRate} onChange={(event) => setCommissionRate(event.target.value)} />
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Durum</span>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="NEW">Yeni</option>
          <option value="REVIEWING">İncelemede</option>
          <option value="APPROVED">Onaylandı</option>
          <option value="REJECTED">Reddedildi</option>
        </select>
      </label>

      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100" onClick={() => save()} disabled={loading}>
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <button type="button" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100" onClick={() => save("APPROVED")} disabled={loading}>
          Onayla
        </button>
        <button type="button" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100" onClick={() => save("REVIEWING")} disabled={loading}>
          İncelemeye Al
        </button>
        <button type="button" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100" onClick={() => save("REJECTED")} disabled={loading}>
          Reddet
        </button>
      </div>

      {message ? <p className="text-xs font-semibold text-emerald-600">{message}</p> : null}
      {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}

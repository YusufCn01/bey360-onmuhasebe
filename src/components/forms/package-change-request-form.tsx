"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PackageChangeRequestFormProps = {
  currentPlanId?: string | null;
  plans: Array<{
    id: string;
    name: string;
    monthlyPrice: number;
    userLimit: number;
    branchLimit: number;
  }>;
};

export function PackageChangeRequestForm({ currentPlanId, plans }: PackageChangeRequestFormProps) {
  const router = useRouter();
  const [targetPlanId, setTargetPlanId] = useState(plans.find((plan) => plan.id !== currentPlanId)?.id ?? plans[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/panel/package-change-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPlanId, note }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error ?? "Talep oluşturulamadı.");
      }

      setMessage("Paket değişim talebi oluşturuldu.");
      setNote("");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Talep oluşturulamadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-600">Hedef paket</span>
        <select
          value={targetPlanId}
          onChange={(event) => setTargetPlanId(event.target.value)}
          className="h-12 w-full rounded-[14px] border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:border-[var(--brand)] focus:outline-none"
        >
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} · {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(plan.monthlyPrice)} / ay
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-600">Not</span>
        <textarea
          rows={4}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Ek kullanıcı, daha fazla şube veya farklı ihtiyacını kısaca yazabilirsin."
          className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[var(--brand)] focus:outline-none"
        />
      </label>

      {message ? <p className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-black text-white shadow-[0_18px_30px_rgba(15,118,110,0.14)] disabled:opacity-60"
      >
        {busy ? "Talep gönderiliyor..." : "Paket talebi oluştur"}
      </button>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PackagePlanOption = {
  id: string;
  name: string;
  code: string;
  monthlyPrice: number;
  userLimit: number;
  branchLimit: number;
};

export function CreateTenantForm({ packagePlans }: { packagePlans: PackagePlanOption[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: "",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "Demo1234!",
    phone: "",
    city: "",
    packagePlanId: packagePlans[0]?.id ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPlan = packagePlans.find((item) => item.id === form.packagePlanId) ?? packagePlans[0] ?? null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/kurucu/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.error?.message ?? "Tenant oluşturulamadı.");
      }

      setMessage(`Tenant açıldı: ${body.data.tenant.name} / ${body.data.owner.email}`);
      setForm({
        companyName: "",
        ownerName: "",
        ownerEmail: "",
        ownerPassword: "Demo1234!",
        phone: "",
        city: "",
        packagePlanId: packagePlans[0]?.id ?? "",
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem başarısız.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Yeni Tenant Açılışı</p>
        <h3 className="mt-2 text-xl font-black text-slate-900">Yeni bayi veya firma hesabı oluştur</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">Kurucu panelinden doğrudan tenant aç, paket ata ve ilk kullanıcıyı hazırla.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Firma adı" value={form.companyName} onChange={(value) => setForm((prev) => ({ ...prev, companyName: value }))} />
        <Field label="Firma sahibi" value={form.ownerName} onChange={(value) => setForm((prev) => ({ ...prev, ownerName: value }))} />
        <Field label="Giriş e-postası" type="email" value={form.ownerEmail} onChange={(value) => setForm((prev) => ({ ...prev, ownerEmail: value }))} />
        <Field label="Başlangıç şifresi" type="password" value={form.ownerPassword} onChange={(value) => setForm((prev) => ({ ...prev, ownerPassword: value }))} />
        <Field label="Telefon" value={form.phone} onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))} />
        <Field label="Şehir" value={form.city} onChange={(value) => setForm((prev) => ({ ...prev, city: value }))} />
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-600">Paket planı</span>
        <select value={form.packagePlanId} onChange={(event) => setForm((prev) => ({ ...prev, packagePlanId: event.target.value }))}>
          {packagePlans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} ({plan.code})
            </option>
          ))}
        </select>
      </label>

      {selectedPlan ? (
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Aylık ücret</p>
            <p className="mt-2 text-lg font-black text-slate-900">₺{selectedPlan.monthlyPrice.toLocaleString("tr-TR")}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Kullanıcı limiti</p>
            <p className="mt-2 text-lg font-black text-slate-900">{selectedPlan.userLimit}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Şube limiti</p>
            <p className="mt-2 text-lg font-black text-slate-900">{selectedPlan.branchLimit}</p>
          </div>
        </div>
      ) : null}

      {message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <button className="rounded-2xl bg-[var(--brand)] px-5 py-3 text-sm font-black text-white hover:bg-[var(--brand-strong)]" disabled={loading}>
        {loading ? "Tenant açılıyor..." : "Tenant Oluştur"}
      </button>
    </form>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-600">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

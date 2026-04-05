"use client";

import { useState } from "react";

export function DealerApplicationForm() {
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    city: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/public/dealer-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.error?.message ?? "Başvuru gönderilemedi.");
      }
      setMessage("Bayi başvurunuz alındı. Kurucu panelinde incelemeye düşecek.");
      setForm({ companyName: "", contactName: "", email: "", phone: "", city: "", note: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem başarısız.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[16px] border border-[var(--line)] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <div className="border-b border-[var(--line)] px-6 py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Bayi Başvurusu</p>
        <h3 className="font-display mt-1 text-[1.8rem] font-extrabold tracking-tight text-slate-900">Bey360 iş ortaklığı formu</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">Yeni bayi, çözüm ortağı veya bölge temsilcisi başvurularını bu formdan toplayın. Başvuru kurucu paneline doğrudan düşer.</p>
      </div>

      <div className="space-y-4 px-6 py-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Firma adı" value={form.companyName} onChange={(value) => setForm((prev) => ({ ...prev, companyName: value }))} />
          <Field label="Yetkili kişi" value={form.contactName} onChange={(value) => setForm((prev) => ({ ...prev, contactName: value }))} />
          <Field label="E-posta" type="email" value={form.email} onChange={(value) => setForm((prev) => ({ ...prev, email: value }))} />
          <Field label="Telefon" value={form.phone} onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))} />
        </div>
        <Field label="Şehir" value={form.city} onChange={(value) => setForm((prev) => ({ ...prev, city: value }))} />
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-600">Not</span>
          <textarea value={form.note} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} rows={4} />
        </label>
        {message ? <p className="rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        <button className="inline-flex h-11 items-center rounded-[10px] bg-[var(--brand)] px-5 text-sm font-extrabold text-white hover:bg-[var(--brand-strong)]" disabled={loading}>
          {loading ? "Başvuru gönderiliyor..." : "Başvuruyu Gönder"}
        </button>
      </div>
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

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const initialForm = {
  code: "",
  name: "",
  phone: "",
  email: "",
  city: "",
};

export function SupplierForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/panel/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setError(result?.error ?? "Tedarikçi kaydı oluşturulamadı.");
      setBusy(false);
      return;
    }

    setMessage("Tedarikçi kartı oluşturuldu.");
    setForm(initialForm);
    router.refresh();
    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-600">Tedarikçi kodu</span>
        <input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="TD0001" required />
      </label>
      <label className="space-y-2 xl:col-span-2">
        <span className="text-sm font-semibold text-slate-600">Firma adı</span>
        <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Örnek Tedarik A.Ş." required />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-600">Şehir</span>
        <input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} placeholder="Ankara" />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-600">Telefon</span>
        <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="0212 000 00 00" />
      </label>
      <label className="space-y-2 xl:col-span-2">
        <span className="text-sm font-semibold text-slate-600">E-posta</span>
        <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="satinalma@firma.com" />
      </label>

      <div className="md:col-span-2 xl:col-span-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
          {message ? <p className="text-sm font-semibold text-emerald-600">{message}</p> : null}
        </div>
        <button disabled={busy} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
          {busy ? "Kaydediliyor..." : "Tedarikçi Oluştur"}
        </button>
      </div>
    </form>
  );
}

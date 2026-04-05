"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TeamMemberForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "Demo1234!",
    role: "ACCOUNTING",
    phone: "",
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
      const response = await fetch("/api/panel/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.error?.message ?? "Kullanıcı eklenemedi.");
      }
      setMessage(`${body.data.user.fullName} kullanıcısı eklendi.`);
      setForm({ fullName: "", email: "", password: "Demo1234!", role: "ACCOUNTING", phone: "" });
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
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Ekip Kullanıcısı</p>
        <h3 className="mt-2 text-xl font-black text-slate-900">Tenant içine yeni kullanıcı ekle</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Ad soyad" value={form.fullName} onChange={(value) => setForm((prev) => ({ ...prev, fullName: value }))} />
        <Field label="E-posta" type="email" value={form.email} onChange={(value) => setForm((prev) => ({ ...prev, email: value }))} />
        <Field label="Şifre" type="password" value={form.password} onChange={(value) => setForm((prev) => ({ ...prev, password: value }))} />
        <label>
          <span className="mb-2 block text-sm font-semibold text-slate-600">Rol</span>
          <select value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}>
            <option value="ADMIN">Yönetici</option>
            <option value="ACCOUNTING">Muhasebe</option>
            <option value="SALES">Satış</option>
            <option value="STOCK">Stok</option>
            <option value="VIEWER">Görüntüleyici</option>
          </select>
        </label>
      </div>

      <Field label="Telefon" value={form.phone} onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))} />

      {message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <button className="rounded-2xl bg-[var(--brand)] px-5 py-3 text-sm font-black text-white hover:bg-[var(--brand-strong)]" disabled={loading}>
        {loading ? "Kullanıcı ekleniyor..." : "Kullanıcı Ekle"}
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

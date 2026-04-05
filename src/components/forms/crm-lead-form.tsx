"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST";

type CustomerOption = {
  id: string;
  code: string;
  name: string;
};

type MemberOption = {
  id: string;
  fullName: string;
  role: string;
};

type LeadFormState = {
  title: string;
  customerId: string;
  ownerUserId: string;
  source: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  status: LeadStatus;
  expectedValue: string;
  probability: string;
  nextActionAt: string;
  summary: string;
};

export function CrmLeadForm({
  endpoint,
  method,
  redirectTo,
  submitLabel,
  customers,
  members,
  initialValue,
}: {
  endpoint: string;
  method: "POST" | "PATCH";
  redirectTo: string;
  submitLabel: string;
  customers: CustomerOption[];
  members: MemberOption[];
  initialValue?: Partial<LeadFormState>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<LeadFormState>({
    title: initialValue?.title ?? "",
    customerId: initialValue?.customerId ?? "",
    ownerUserId: initialValue?.ownerUserId ?? "",
    source: initialValue?.source ?? "",
    contactName: initialValue?.contactName ?? "",
    contactEmail: initialValue?.contactEmail ?? "",
    contactPhone: initialValue?.contactPhone ?? "",
    status: initialValue?.status ?? "NEW",
    expectedValue: initialValue?.expectedValue ?? "0",
    probability: initialValue?.probability ?? "20",
    nextActionAt: initialValue?.nextActionAt ?? "",
    summary: initialValue?.summary ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      setError(result?.error ?? result?.error?.message ?? "Fırsat kaydedilemedi.");
      setBusy(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <Field label="Fırsat başlığı" value={form.title} onChange={(value) => setForm((prev) => ({ ...prev, title: value }))} required />

      <SelectField label="Müşteri" value={form.customerId} onChange={(value) => setForm((prev) => ({ ...prev, customerId: value }))}>
        <option value="">Genel fırsat</option>
        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.code} - {customer.name}
          </option>
        ))}
      </SelectField>

      <SelectField label="Sorumlu kullanıcı" value={form.ownerUserId} onChange={(value) => setForm((prev) => ({ ...prev, ownerUserId: value }))}>
        <option value="">Atanmamış</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.fullName} - {member.role}
          </option>
        ))}
      </SelectField>

      <Field label="Kaynak" value={form.source} onChange={(value) => setForm((prev) => ({ ...prev, source: value }))} />
      <Field label="Kontak kişi" value={form.contactName} onChange={(value) => setForm((prev) => ({ ...prev, contactName: value }))} />
      <Field label="Telefon" value={form.contactPhone} onChange={(value) => setForm((prev) => ({ ...prev, contactPhone: value }))} />
      <Field label="E-posta" type="email" value={form.contactEmail} onChange={(value) => setForm((prev) => ({ ...prev, contactEmail: value }))} />

      <SelectField label="Durum" value={form.status} onChange={(value) => setForm((prev) => ({ ...prev, status: value as LeadStatus }))}>
        <option value="NEW">Yeni</option>
        <option value="CONTACTED">İlk Temas</option>
        <option value="QUALIFIED">Nitelendi</option>
        <option value="PROPOSAL">Teklif</option>
        <option value="NEGOTIATION">Pazarlık</option>
        <option value="WON">Kazanıldı</option>
        <option value="LOST">Kaybedildi</option>
      </SelectField>

      <Field label="Beklenen tutar" type="number" value={form.expectedValue} onChange={(value) => setForm((prev) => ({ ...prev, expectedValue: value }))} />
      <Field label="Olasılık %" type="number" value={form.probability} onChange={(value) => setForm((prev) => ({ ...prev, probability: value }))} />
      <Field label="Sonraki aksiyon tarihi" type="date" value={form.nextActionAt} onChange={(value) => setForm((prev) => ({ ...prev, nextActionAt: value }))} />

      <label className="md:col-span-2">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Özet</span>
        <textarea
          value={form.summary}
          onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
          rows={5}
          className="min-h-32 w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)]"
        />
      </label>

      <div className="md:col-span-2 flex items-center justify-between gap-3">
        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : <span />}
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-black text-white hover:bg-[var(--brand-strong)] disabled:opacity-60"
        >
          {busy ? "Kaydediliyor..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)]"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)]"
      >
        {children}
      </select>
    </label>
  );
}

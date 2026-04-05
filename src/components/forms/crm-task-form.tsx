"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

type TaskStatus = "OPEN" | "IN_PROGRESS" | "DONE" | "CANCELLED";
type TaskPriority = "LOW" | "NORMAL" | "HIGH";

type LeadOption = {
  id: string;
  title: string;
};

type MemberOption = {
  id: string;
  fullName: string;
  role: string;
};

type TaskFormState = {
  title: string;
  leadId: string;
  assignedUserId: string;
  dueAt: string;
  status: TaskStatus;
  priority: TaskPriority;
  note: string;
};

export function CrmTaskForm({
  endpoint,
  method,
  redirectTo,
  submitLabel,
  leads,
  members,
  initialValue,
}: {
  endpoint: string;
  method: "POST" | "PATCH";
  redirectTo: string;
  submitLabel: string;
  leads: LeadOption[];
  members: MemberOption[];
  initialValue?: Partial<TaskFormState>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<TaskFormState>({
    title: initialValue?.title ?? "",
    leadId: initialValue?.leadId ?? "",
    assignedUserId: initialValue?.assignedUserId ?? "",
    dueAt: initialValue?.dueAt ?? "",
    status: initialValue?.status ?? "OPEN",
    priority: initialValue?.priority ?? "NORMAL",
    note: initialValue?.note ?? "",
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
      setError(result?.error ?? result?.error?.message ?? "Görev kaydedilemedi.");
      setBusy(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <Field label="Görev başlığı" value={form.title} onChange={(value) => setForm((prev) => ({ ...prev, title: value }))} required />

      <SelectField label="Bağlı fırsat" value={form.leadId} onChange={(value) => setForm((prev) => ({ ...prev, leadId: value }))}>
        <option value="">Genel görev</option>
        {leads.map((lead) => (
          <option key={lead.id} value={lead.id}>
            {lead.title}
          </option>
        ))}
      </SelectField>

      <SelectField label="Atanan kullanıcı" value={form.assignedUserId} onChange={(value) => setForm((prev) => ({ ...prev, assignedUserId: value }))}>
        <option value="">Atanmamış</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.fullName} - {member.role}
          </option>
        ))}
      </SelectField>

      <Field label="Termin tarihi" type="date" value={form.dueAt} onChange={(value) => setForm((prev) => ({ ...prev, dueAt: value }))} />

      <SelectField label="Durum" value={form.status} onChange={(value) => setForm((prev) => ({ ...prev, status: value as TaskStatus }))}>
        <option value="OPEN">Açık</option>
        <option value="IN_PROGRESS">Devam Ediyor</option>
        <option value="DONE">Tamamlandı</option>
        <option value="CANCELLED">İptal</option>
      </SelectField>

      <SelectField label="Öncelik" value={form.priority} onChange={(value) => setForm((prev) => ({ ...prev, priority: value as TaskPriority }))}>
        <option value="LOW">Düşük</option>
        <option value="NORMAL">Normal</option>
        <option value="HIGH">Yüksek</option>
      </SelectField>

      <label className="md:col-span-2">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Açıklama</span>
        <textarea
          value={form.note}
          onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
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

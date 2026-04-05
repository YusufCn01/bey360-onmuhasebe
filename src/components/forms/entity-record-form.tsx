"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type FieldConfig = {
  key: string;
  label: string;
  type?: "text" | "email" | "number" | "date";
  options?: string[];
};

export function EntityRecordForm({
  endpoint,
  fields,
  initialData,
  redirectTo,
  submitLabel,
  deleteLabel,
}: {
  endpoint: string;
  fields: FieldConfig[];
  initialData: Record<string, string>;
  redirectTo: string;
  submitLabel: string;
  deleteLabel: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>(initialData);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      setError(result?.error ?? "Kayıt güncellenemedi.");
      setBusy(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`${deleteLabel} silinsin mi?`)) {
      return;
    }

    setBusy(true);
    setError(null);

    const response = await fetch(endpoint, { method: "DELETE" });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      setError(result?.error ?? "Kayıt silinemedi.");
      setBusy(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className="space-y-2">
            <span className="text-sm font-semibold text-slate-600">{field.label}</span>
            {field.options ? (
              <select value={form[field.key] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}>
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type ?? "text"}
                value={form[field.key] ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
              />
            )}
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>{error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}</div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={remove} disabled={busy} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60">
            Sil
          </button>
          <button type="submit" disabled={busy} className="rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-black text-white hover:bg-[var(--brand-strong)] disabled:opacity-60">
            {busy ? "Kaydediliyor..." : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

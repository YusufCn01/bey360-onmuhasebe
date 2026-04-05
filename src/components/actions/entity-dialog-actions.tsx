"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type FieldConfig = {
  key: string;
  label: string;
  type?: "text" | "email" | "number" | "date" | "textarea";
  options?: string[];
};

export function EntityDialogActions({
  title,
  endpoint,
  fields,
  initialData,
  deleteLabel,
}: {
  title: string;
  endpoint: string;
  fields: FieldConfig[];
  initialData: Record<string, string>;
  deleteLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>(initialData);

  const displayFields = useMemo(
    () =>
      fields.map((field) => ({
        ...field,
        value: form[field.key] ?? "",
      })),
    [fields, form],
  );

  async function save() {
    setBusy(true);
    setError(null);
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.error ?? "Kayıt güncellenemedi.");
      setBusy(false);
      return;
    }
    setEditing(false);
    setBusy(false);
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
    if (!response.ok) {
      setError(result?.error ?? "Kayıt silinemedi.");
      setBusy(false);
      return;
    }
    setOpen(false);
    setBusy(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(true)} className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[var(--panel-soft)]">
          Detay
        </button>
        <button type="button" onClick={() => { setOpen(true); setEditing(true); }} className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[var(--panel-soft)]">
          Düzenle
        </button>
        <button type="button" onClick={remove} disabled={busy} className="rounded-[8px] border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60">
          Sil
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
          <div className="w-full max-w-2xl rounded-[16px] border border-[var(--line)] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Kayıt Detayı</p>
                <h3 className="font-display mt-1 text-2xl font-extrabold text-slate-900">{title}</h3>
              </div>
              <button type="button" onClick={() => { setOpen(false); setEditing(false); setError(null); setForm(initialData); }} className="rounded-[10px] border border-[var(--line)] px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-[var(--panel-soft)]">
                Kapat
              </button>
            </div>

            <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
              {displayFields.map((field) => (
                <label key={field.key} className="space-y-2">
                  <span className="text-sm font-semibold text-slate-600">{field.label}</span>
                  {editing ? (
                    field.options ? (
                      <select value={field.value} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}>
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "textarea" ? (
                      <textarea
                        rows={4}
                        value={field.value}
                        onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                      />
                    ) : (
                      <input
                        type={field.type ?? "text"}
                        value={field.value}
                        onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                      />
                    )
                  ) : (
                    <div className="rounded-[10px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm font-semibold text-slate-800 whitespace-pre-wrap">
                      {field.value || "-"}
                    </div>
                  )}
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] px-5 py-4">
              <div>{error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}</div>
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <button type="button" onClick={() => { setEditing(false); setError(null); setForm(initialData); }} className="rounded-[10px] border border-[var(--line)] px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-[var(--panel-soft)]">
                      Vazgeç
                    </button>
                    <button type="button" onClick={save} disabled={busy} className="rounded-[10px] bg-[var(--brand)] px-4 py-2 text-sm font-extrabold text-white hover:bg-[var(--brand-strong)] disabled:opacity-60">
                      {busy ? "Kaydediliyor..." : "Kaydet"}
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setEditing(true)} className="rounded-[10px] bg-[var(--brand)] px-4 py-2 text-sm font-extrabold text-white hover:bg-[var(--brand-strong)]">
                    Düzenle
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

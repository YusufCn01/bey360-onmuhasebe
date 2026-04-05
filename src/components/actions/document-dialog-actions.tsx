"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientId } from "@/lib/client-id";

type FieldConfig = {
  key: string;
  label: string;
  type?: "text" | "date";
  options?: string[];
};

type ProductOption = {
  id: string;
  code: string;
  name: string;
};

type LineItem = {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
};

function createLineItem(product: ProductOption | undefined): LineItem {
  return {
    id: createClientId(),
    productId: product?.id ?? "",
    quantity: "1",
    unitPrice: "0",
    vatRate: "20",
  };
}

export function DocumentDialogActions({
  title,
  endpoint,
  deleteLabel,
  fields,
  initialData,
  initialItems,
  products,
}: {
  title: string;
  endpoint: string;
  deleteLabel: string;
  fields: FieldConfig[];
  initialData: Record<string, string>;
  initialItems: LineItem[];
  products: ProductOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>(initialData);
  const [items, setItems] = useState<LineItem[]>(initialItems.length ? initialItems : [createLineItem(products[0])]);

  function closeModal() {
    setOpen(false);
    setEditing(false);
    setError(null);
    setForm(initialData);
    setItems(initialItems.length ? initialItems : [createLineItem(products[0])]);
  }

  function updateLine(id: string, patch: Partial<LineItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addLine() {
    setItems((current) => [...current, createLineItem(products[0])]);
  }

  function removeLine(id: string) {
    setItems((current) => (current.length === 1 ? current : current.filter((item) => item.id !== id)));
  }

  async function save() {
    setBusy(true);
    setError(null);
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
        })),
      }),
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
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[16px] border border-[var(--line)] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Belge Detayı</p>
                <h3 className="font-display mt-1 text-2xl font-extrabold text-slate-900">{title}</h3>
              </div>
              <button type="button" onClick={closeModal} className="rounded-[10px] border border-[var(--line)] px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-[var(--panel-soft)]">
                Kapat
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              <div className="grid gap-4 md:grid-cols-3">
                {fields.map((field) => (
                  <label key={field.key} className="space-y-2">
                    <span className="text-sm font-semibold text-slate-600">{field.label}</span>
                    {editing ? (
                      field.options ? (
                        <select value={form[field.key] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}>
                          {field.options.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input type={field.type ?? "text"} value={form[field.key] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} />
                      )
                    ) : (
                      <div className="rounded-[10px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm font-semibold text-slate-800">
                        {form[field.key] || "-"}
                      </div>
                    )}
                  </label>
                ))}
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel-soft)] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Belge Satırları</p>
                    <p className="mt-1 text-sm text-slate-600">Satırları modal içinden düzenleyebilirsin.</p>
                  </div>
                  {editing ? (
                    <button type="button" onClick={addLine} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100">
                      Satır Ekle
                    </button>
                  ) : null}
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => {
                    const lineTotal = Number(item.quantity || 0) * Number(item.unitPrice || 0) * (1 + Number(item.vatRate || 0) / 100);
                    return (
                      <div key={item.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 xl:grid-cols-[1.5fr_0.6fr_0.7fr_0.6fr_0.7fr_auto]">
                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-slate-600">Kalem #{index + 1}</span>
                          {editing ? (
                            <select value={item.productId} onChange={(event) => updateLine(item.id, { productId: event.target.value })}>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>{product.code} · {product.name}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="rounded-xl border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm font-semibold text-slate-800">
                              {products.find((product) => product.id === item.productId)?.name ?? "-"}
                            </div>
                          )}
                        </label>
                        <FieldCell label="Miktar" editing={editing} value={item.quantity} onChange={(value) => updateLine(item.id, { quantity: value })} />
                        <FieldCell label="Birim fiyat" editing={editing} value={item.unitPrice} onChange={(value) => updateLine(item.id, { unitPrice: value })} />
                        <FieldCell label="KDV %" editing={editing} value={item.vatRate} onChange={(value) => updateLine(item.id, { vatRate: value })} />
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Satır toplamı</p>
                          <p className="mt-2 text-lg font-black text-slate-900">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(lineTotal)}</p>
                        </div>
                        {editing ? (
                          <div className="flex items-end">
                            <button type="button" onClick={() => removeLine(item.id)} disabled={items.length === 1} className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                              Sil
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] px-5 py-4">
              <div>{error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}</div>
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <button type="button" onClick={closeModal} className="rounded-[10px] border border-[var(--line)] px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-[var(--panel-soft)]">
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

function FieldCell({ label, value, editing, onChange }: { label: string; value: string; editing: boolean; onChange: (value: string) => void }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      {editing ? (
        <input type="number" step="0.01" value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm font-semibold text-slate-800">{value}</div>
      )}
    </label>
  );
}

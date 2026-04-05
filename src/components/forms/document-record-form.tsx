"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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

export function DocumentRecordForm({
  endpoint,
  redirectTo,
  submitLabel,
  deleteLabel,
  fields,
  initialData,
  initialItems,
  products,
}: {
  endpoint: string;
  redirectTo: string;
  submitLabel: string;
  deleteLabel: string;
  fields: FieldConfig[];
  initialData: Record<string, string>;
  initialItems: LineItem[];
  products: ProductOption[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>(initialData);
  const [items, setItems] = useState<LineItem[]>(initialItems.length ? initialItems : [createLineItem(products[0])]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateLine(id: string, patch: Partial<LineItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addLine() {
    setItems((current) => [...current, createLineItem(products[0])]);
  }

  function removeLine(id: string) {
    setItems((current) => (current.length === 1 ? current : current.filter((item) => item.id !== id)));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    if (!response.ok || !result?.success) {
      setError(result?.error ?? "Belge güncellenemedi.");
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
      setError(result?.error ?? "Belge silinemedi.");
      setBusy(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
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
              <input type={field.type ?? "text"} value={form[field.key] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} />
            )}
          </label>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel-soft)] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Belge Satırları</p>
            <p className="mt-1 text-sm text-slate-600">Ürün ve tutar kalemlerini burada düzenleyin.</p>
          </div>
          <button type="button" onClick={addLine} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100">
            Satır Ekle
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => {
            const lineTotal = Number(item.quantity || 0) * Number(item.unitPrice || 0) * (1 + Number(item.vatRate || 0) / 100);
            return (
              <div key={item.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 xl:grid-cols-[1.5fr_0.6fr_0.7fr_0.6fr_0.7fr_auto]">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-600">Kalem #{index + 1}</span>
                  <select value={item.productId} onChange={(event) => updateLine(item.id, { productId: event.target.value })}>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.code} · {product.name}
                      </option>
                    ))}
                  </select>
                </label>
                <FieldCell label="Miktar" value={item.quantity} onChange={(value) => updateLine(item.id, { quantity: value })} />
                <FieldCell label="Birim fiyat" value={item.unitPrice} onChange={(value) => updateLine(item.id, { unitPrice: value })} />
                <FieldCell label="KDV %" value={item.vatRate} onChange={(value) => updateLine(item.id, { vatRate: value })} />
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Satır toplamı</p>
                  <p className="mt-2 text-lg font-black text-slate-900">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(lineTotal)}</p>
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={() => removeLine(item.id)} disabled={items.length === 1} className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                    Sil
                  </button>
                </div>
              </div>
            );
          })}
        </div>
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

function FieldCell({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <input type="number" step="0.01" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

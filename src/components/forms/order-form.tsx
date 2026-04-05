"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientId } from "@/lib/client-id";

type CustomerOption = { id: string; code: string; name: string };
type ProductOption = { id: string; code: string; name: string; salePrice: number; vatRate: number };
type LineItem = { id: string; productId: string; quantity: string; unitPrice: string; vatRate: string };

function createLineItem(product: ProductOption | undefined): LineItem {
  return {
    id: createClientId(),
    productId: product?.id ?? "",
    quantity: "1",
    unitPrice: String(product?.salePrice ?? 0),
    vatRate: String(product?.vatRate ?? 20),
  };
}

export function OrderForm({ customers, products, nextOrderNo }: { customers: CustomerOption[]; products: ProductOption[]; nextOrderNo: string }) {
  const router = useRouter();
  const [orderNo, setOrderNo] = useState(nextOrderNo);
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [items, setItems] = useState<LineItem[]>([createLineItem(products[0])]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const preview = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const subtotal = Number(item.quantity || 0) * Number(item.unitPrice || 0);
        const vatTotal = subtotal * (Number(item.vatRate || 0) / 100);
        acc.subtotal += subtotal;
        acc.vatTotal += vatTotal;
        acc.grandTotal += subtotal + vatTotal;
        return acc;
      },
      { subtotal: 0, vatTotal: 0, grandTotal: 0 },
    );
  }, [items]);

  function updateLine(id: string, patch: Partial<LineItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function onProductChange(id: string, productId: string) {
    const product = products.find((item) => item.id === productId);
    if (!product) {
      updateLine(id, { productId });
      return;
    }

    updateLine(id, {
      productId,
      unitPrice: String(product.salePrice),
      vatRate: String(product.vatRate),
    });
  }

  function addLine() {
    setItems((current) => [...current, createLineItem(products[0])]);
  }

  function removeLine(id: string) {
    setItems((current) => (current.length === 1 ? current : current.filter((item) => item.id !== id)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/panel/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNo,
        customerId,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
        })),
        note,
      }),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setError(result?.error ?? "Sipariş oluşturulamadı.");
      setBusy(false);
      return;
    }

    setMessage("Sipariş oluşturuldu.");
    setOrderNo(result?.data?.nextOrderNo ?? orderNo);
    setNote("");
    setItems([createLineItem(products[0])]);
    router.refresh();
    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2"><span className="text-sm font-semibold text-slate-600">Sipariş no</span><input value={orderNo} onChange={(e)=>setOrderNo(e.target.value)} required /></label>
        <label className="space-y-2 xl:col-span-2"><span className="text-sm font-semibold text-slate-600">Müşteri</span><select value={customerId} onChange={(e)=>setCustomerId(e.target.value)} required>{customers.map((item)=><option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></label>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Toplam</p><p className="mt-2 text-2xl font-black text-slate-900">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(preview.grandTotal)}</p><p className="mt-1 text-xs text-slate-500">Ara toplam {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(preview.subtotal)} · KDV {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(preview.vatTotal)}</p></div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Sipariş Kalemleri</p>
            <p className="mt-1 text-sm text-slate-600">Doğrudan siparişte birden fazla satır ekleyebilirsin.</p>
          </div>
          <button type="button" onClick={addLine} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100">Satır Ekle</button>
        </div>
        <div className="space-y-3">
          {items.map((item, index) => {
            const lineTotal = Number(item.quantity || 0) * Number(item.unitPrice || 0) * (1 + Number(item.vatRate || 0) / 100);
            return (
              <div key={item.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 xl:grid-cols-[1.4fr_0.6fr_0.7fr_0.6fr_0.7fr_auto]">
                <label className="space-y-2"><span className="text-sm font-semibold text-slate-600">Kalem #{index + 1}</span><select value={item.productId} onChange={(e)=>onProductChange(item.id, e.target.value)} required>{products.map((product)=><option key={product.id} value={product.id}>{product.code} · {product.name}</option>)}</select></label>
                <label className="space-y-2"><span className="text-sm font-semibold text-slate-600">Miktar</span><input type="number" step="0.001" value={item.quantity} onChange={(e)=>updateLine(item.id, { quantity: e.target.value })} required /></label>
                <label className="space-y-2"><span className="text-sm font-semibold text-slate-600">Birim fiyat</span><input type="number" step="0.01" value={item.unitPrice} onChange={(e)=>updateLine(item.id, { unitPrice: e.target.value })} required /></label>
                <label className="space-y-2"><span className="text-sm font-semibold text-slate-600">KDV %</span><input type="number" step="0.01" value={item.vatRate} onChange={(e)=>updateLine(item.id, { vatRate: e.target.value })} required /></label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Satır toplamı</p><p className="mt-2 text-lg font-black text-slate-900">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(lineTotal)}</p></div>
                <div className="flex items-end"><button type="button" onClick={() => removeLine(item.id)} disabled={items.length === 1} className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50">Sil</button></div>
              </div>
            );
          })}
        </div>
      </div>

      <label className="space-y-2 block"><span className="text-sm font-semibold text-slate-600">Not</span><textarea value={note} onChange={(e)=>setNote(e.target.value)} rows={3} placeholder="Teslimat, sevk veya sipariş notu" /></label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>{error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}{message ? <p className="text-sm font-semibold text-emerald-600">{message}</p> : null}</div>
        <button disabled={busy} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white disabled:opacity-60">{busy ? "Kaydediliyor..." : "Sipariş Oluştur"}</button>
      </div>
    </form>
  );
}

"use client";

import Link from "next/link";
import { ReturnDirection, ReturnReason } from "@prisma/client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarcodeScannerModal } from "@/components/forms/barcode-scanner-modal";
import { createClientId } from "@/lib/client-id";

type PartyOption = {
  id: string;
  code: string;
  name: string;
};

type ProductOption = {
  id: string;
  code: string;
  name: string;
  barcode?: string | null;
  salePrice: number;
  purchasePrice: number;
  vatRate: number;
};

type LineItem = {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
};

function createLineItem(product: ProductOption | undefined, direction: ReturnDirection): LineItem {
  return {
    id: createClientId(),
    productId: product?.id ?? "",
    quantity: "1",
    unitPrice: String(product ? (direction === ReturnDirection.SALES ? product.salePrice : product.purchasePrice) : 0),
    vatRate: String(product?.vatRate ?? 20),
  };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value);
}

export function ReturnForm({
  direction,
  customers,
  suppliers,
  products,
  nextReturnNo,
  redirectPath,
}: {
  direction: ReturnDirection;
  customers: PartyOption[];
  suppliers: PartyOption[];
  products: ProductOption[];
  nextReturnNo: string;
  redirectPath: string;
}) {
  const router = useRouter();
  const [returnNo, setReturnNo] = useState(nextReturnNo);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [reason, setReason] = useState<ReturnReason>(ReturnReason.OTHER);
  const [note, setNote] = useState("");
  const [items, setItems] = useState<LineItem[]>([createLineItem(products[0], direction)]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const preview = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unitPrice || 0);
        const vatRate = Number(item.vatRate || 0);
        const subtotal = quantity * unitPrice;
        const vatTotal = subtotal * (vatRate / 100);
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

  function addLine() {
    setItems((current) => [...current, createLineItem(products[0], direction)]);
  }

  function removeLine(id: string) {
    setItems((current) => (current.length === 1 ? current : current.filter((item) => item.id !== id)));
  }

  function changeProduct(id: string, productId: string) {
    const product = products.find((entry) => entry.id === productId);
    updateLine(id, {
      productId,
      unitPrice: String(product ? (direction === ReturnDirection.SALES ? product.salePrice : product.purchasePrice) : 0),
      vatRate: String(product?.vatRate ?? 20),
    });
  }

  function addProductToLines(product: ProductOption) {
    setItems((current) => {
      const existingLine = current.find((line) => line.productId === product.id);
      if (existingLine) {
        return current.map((line) => (line.id === existingLine.id ? { ...line, quantity: String((Number(line.quantity || 0) || 0) + 1) } : line));
      }

      return [
        ...current,
        {
          id: createClientId(),
          productId: product.id,
          quantity: "1",
          unitPrice: String(direction === ReturnDirection.SALES ? product.salePrice : product.purchasePrice),
          vatRate: String(product.vatRate),
        },
      ];
    });
  }

  function handleBarcodeDetected(code: string) {
    const normalized = code.trim();
    const product =
      products.find((item) => (item.barcode ?? "").trim() === normalized) ??
      products.find((item) => item.code.trim() === normalized);

    setScannerOpen(false);
    if (!product) {
      setError(`Bu barkoda ait ürün bulunamadı: ${normalized}`);
      return;
    }

    setError(null);
    setMessage(`İade kalemine eklendi: ${product.name}`);
    addProductToLines(product);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/panel/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction,
          returnNo,
          customerId: direction === ReturnDirection.SALES ? customerId : null,
          supplierId: direction === ReturnDirection.PURCHASE ? supplierId : null,
          issueDate,
          reason,
          note,
          items,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error ?? "İade kaydedilemedi.");
      }

      setMessage("İade kaydı oluşturuldu.");
      setReturnNo(result?.data?.nextReturnNo ?? nextReturnNo);
      setItems([createLineItem(products[0], direction)]);
      setNote("");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "İade kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-4 rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">İade Belgesi</p>
            <h3 className="mt-1 text-[1.7rem] font-extrabold tracking-tight text-slate-900">
              {direction === ReturnDirection.SALES ? "Satış İadesi" : "Satın Alma İadesi"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">İade nedenini, karşı tarafı ve ürün kalemlerini birlikte yönetin.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setScannerOpen(true)} className="rounded-[10px] border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Barkod Okut
            </button>
            <button type="submit" disabled={busy} className="rounded-[10px] bg-[var(--brand)] px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-60">
              {busy ? "Kaydediliyor..." : "İadeyi Kaydet"}
            </button>
            <Link href={redirectPath} className="rounded-[10px] border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
              İade Listesi
            </Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.7fr]">
          <section className="rounded-[16px] border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-600">İade no</span>
                <input value={returnNo} onChange={(event) => setReturnNo(event.target.value)} required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-600">{direction === ReturnDirection.SALES ? "Müşteri" : "Tedarikçi"}</span>
                {direction === ReturnDirection.SALES ? (
                  <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} required>
                    {customers.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.code} · {item.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select value={supplierId} onChange={(event) => setSupplierId(event.target.value)} required>
                    {suppliers.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.code} · {item.name}
                      </option>
                    ))}
                  </select>
                )}
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-600">İade tarihi</span>
                <input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-600">İade nedeni</span>
                <select value={reason} onChange={(event) => setReason(event.target.value as ReturnReason)}>
                  <option value="DAMAGE">Hasarlı ürün</option>
                  <option value="WRONG_ITEM">Yanlış ürün</option>
                  <option value="PRICE_DISPUTE">Fiyat uyuşmazlığı</option>
                  <option value="CUSTOMER_REQUEST">Müşteri talebi</option>
                  <option value="SUPPLIER_REQUEST">Tedarikçi talebi</option>
                  <option value="OTHER">Diğer</option>
                </select>
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-slate-600">Not</span>
                <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
              </label>
            </div>
          </section>

          <aside className="rounded-[16px] border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Toplamlar</p>
            <p className="mt-3 text-[2rem] font-extrabold text-slate-900">{formatMoney(preview.grandTotal)}</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-slate-500">Ara toplam</span><strong>{formatMoney(preview.subtotal)}</strong></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">KDV</span><strong>{formatMoney(preview.vatTotal)}</strong></div>
            </div>
            {message ? <p className="mt-4 text-sm font-semibold text-emerald-600">{message}</p> : null}
            {error ? <p className="mt-4 text-sm font-semibold text-rose-600">{error}</p> : null}
          </aside>
        </div>

        <section className="rounded-[16px] border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">İade Kalemleri</p>
              <h3 className="mt-1 text-xl font-extrabold text-slate-900">Kalem listesi</h3>
            </div>
            <button type="button" onClick={addLine} className="rounded-[10px] border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Satır ekle
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, index) => {
              const lineTotal = Number(item.quantity || 0) * Number(item.unitPrice || 0) * (1 + Number(item.vatRate || 0) / 100);
              return (
                <div key={item.id} className="grid gap-3 rounded-[14px] border border-[var(--line)] bg-white p-4 xl:grid-cols-[1.5fr_0.6fr_0.7fr_0.6fr_0.7fr_auto]">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-600">Kalem #{index + 1}</span>
                    <select value={item.productId} onChange={(event) => changeProduct(item.id, event.target.value)} required>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.code} · {product.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-600">Miktar</span>
                    <input type="number" step="0.001" value={item.quantity} onChange={(event) => updateLine(item.id, { quantity: event.target.value })} required />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-600">Birim fiyat</span>
                    <input type="number" step="0.01" value={item.unitPrice} onChange={(event) => updateLine(item.id, { unitPrice: event.target.value })} required />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-600">KDV %</span>
                    <input type="number" step="0.01" value={item.vatRate} onChange={(event) => updateLine(item.id, { vatRate: event.target.value })} required />
                  </label>
                  <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Satır toplamı</p>
                    <p className="mt-2 text-lg font-extrabold text-slate-900">{formatMoney(lineTotal)}</p>
                  </div>
                  <div className="flex items-end">
                    <button type="button" onClick={() => removeLine(item.id)} disabled={items.length === 1} className="w-full rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                      Sil
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </form>

      <BarcodeScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} products={products} onDetected={handleBarcodeDetected} />
    </>
  );
}

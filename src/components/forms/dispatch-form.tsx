"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarcodeScannerModal } from "@/components/forms/barcode-scanner-modal";
import { createClientId } from "@/lib/client-id";

type CustomerOption = {
  id: string;
  code: string;
  name: string;
  taxNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
};

type ProductOption = {
  id: string;
  code: string;
  name: string;
  barcode?: string | null;
  salePrice: number;
  vatRate: number;
};

type LineItem = {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
};

function createLineItem(product?: ProductOption): LineItem {
  return {
    id: createClientId(),
    productId: product?.id ?? "",
    quantity: "1",
    unitPrice: String(product?.salePrice ?? 0),
    vatRate: String(product?.vatRate ?? 20),
  };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value);
}

export function DispatchForm({
  customers,
  products,
  nextDispatchNo,
  redirectPath,
}: {
  customers: CustomerOption[];
  products: ProductOption[];
  nextDispatchNo: string;
  redirectPath: string;
}) {
  const router = useRouter();
  const [dispatchNo, setDispatchNo] = useState(nextDispatchNo);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<LineItem[]>([createLineItem(products[0])]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const selectedCustomer = customers.find((item) => item.id === customerId) ?? null;

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

  function changeProduct(id: string, productId: string) {
    const product = products.find((entry) => entry.id === productId);
    updateLine(id, {
      productId,
      unitPrice: String(product?.salePrice ?? 0),
      vatRate: String(product?.vatRate ?? 20),
    });
  }

  function addLine() {
    setItems((current) => [...current, createLineItem(products[0])]);
  }

  function removeLine(id: string) {
    setItems((current) => (current.length === 1 ? current : current.filter((item) => item.id !== id)));
  }

  function addProductToLines(product: ProductOption) {
    setItems((current) => {
      const existingLine = current.find((line) => line.productId === product.id);
      if (existingLine) {
        return current.map((line) =>
          line.id === existingLine.id ? { ...line, quantity: String((Number(line.quantity || 0) || 0) + 1) } : line,
        );
      }

      return [
        ...current,
        {
          id: createClientId(),
          productId: product.id,
          quantity: "1",
          unitPrice: String(product.salePrice),
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
    setMessage(`Ürün eklendi: ${product.name}`);
    addProductToLines(product);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/panel/dispatch-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dispatchNo,
          customerId,
          issueDate,
          deliveryDate,
          note,
          items,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error ?? "İrsaliye kaydedilemedi.");
      }

      setMessage("İrsaliye oluşturuldu.");
      setDispatchNo(result?.data?.nextDispatchNo ?? nextDispatchNo);
      setItems([createLineItem(products[0])]);
      setNote("");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "İrsaliye kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-4 rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Belge Düzeni</p>
            <h3 className="mt-1 text-[1.7rem] font-extrabold tracking-tight text-slate-900">Satış İrsaliyesi</h3>
            <p className="mt-1 text-sm text-slate-500">Sevk bilgisi, müşteri kartı ve ürün kalemleri aynı akışta tutuldu.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setScannerOpen(true)} className="rounded-[10px] border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Barkod Okut
            </button>
            <button type="submit" disabled={busy} className="rounded-[10px] bg-[var(--brand)] px-4 py-2.5 text-sm font-extrabold text-white hover:bg-[var(--brand-strong)] disabled:opacity-60">
              {busy ? "Kaydediliyor..." : "İrsaliyeyi Kaydet"}
            </button>
            <Link href={redirectPath} className="rounded-[10px] border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
              İrsaliye Listesi
            </Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.65fr]">
          <section className="rounded-[16px] border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-600">İrsaliye no</span>
                <input value={dispatchNo} onChange={(event) => setDispatchNo(event.target.value)} required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-600">Müşteri</span>
                <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} required>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.code} · {customer.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-600">İrsaliye tarihi</span>
                <input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-600">Teslim tarihi</span>
                <input type="date" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-slate-600">Sevk notu</span>
                <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Araç, teslim personeli, sevk notu" />
              </label>
            </div>
          </section>

          <aside className="rounded-[16px] border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Cari Özeti</p>
            <h3 className="mt-1 text-xl font-extrabold text-slate-900">{selectedCustomer?.name ?? "Müşteri seçin"}</h3>
            <div className="mt-4 space-y-3">
              <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Vergi / Kimlik</p>
                <p className="mt-2 text-sm font-extrabold text-slate-900">{selectedCustomer?.taxNumber ?? "Belirtilmedi"}</p>
              </div>
              <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">İletişim</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">{selectedCustomer?.phone ?? "Telefon yok"}</p>
                <p className="mt-1 text-sm text-slate-500">{selectedCustomer?.email ?? "E-posta yok"}</p>
              </div>
              <div className="rounded-[12px] bg-slate-50 px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Toplam</p>
                <p className="mt-2 text-[2rem] font-extrabold text-slate-900">{formatMoney(preview.grandTotal)}</p>
                <p className="mt-1 text-xs text-slate-500">Ara toplam {formatMoney(preview.subtotal)} · KDV {formatMoney(preview.vatTotal)}</p>
              </div>
              {message ? <p className="text-sm font-semibold text-emerald-600">{message}</p> : null}
              {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
            </div>
          </aside>
        </div>

        <section className="rounded-[16px] border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Kalemler</p>
              <h3 className="mt-1 text-xl font-extrabold text-slate-900">İrsaliye satırları</h3>
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

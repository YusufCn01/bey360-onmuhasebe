"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarcodeScannerModal } from "@/components/forms/barcode-scanner-modal";
import { createClientId } from "@/lib/client-id";

type InvoiceDirection = "SALES" | "PURCHASE";
type SalesInvoiceKind = "WHOLESALE" | "RETAIL";

type PartyOption = {
  id: string;
  name: string;
  code: string;
  taxNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  district?: string | null;
  address?: string | null;
  country?: string | null;
  postalCode?: string | null;
  taxOffice?: string | null;
};

type ProductOption = {
  id: string;
  name: string;
  code: string;
  barcode?: string | null;
  salePrice: number;
  purchasePrice: number;
  vatRate: number;
};

type CompanyInfo = {
  name: string;
  taxNumber?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  email?: string | null;
  phone?: string | null;
  gibAlias?: string | null;
};

type LineItem = {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
};

function createLineItem(product: ProductOption | undefined, direction: InvoiceDirection): LineItem {
  return {
    id: createClientId(),
    productId: product?.id ?? "",
    quantity: "1",
    unitPrice: String(product ? (direction === "SALES" ? product.salePrice : product.purchasePrice) : 0),
    vatRate: String(product?.vatRate ?? 20),
  };
}

function formatMoney(value: number, currencyCode = "TRY") {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: currencyCode === "TL" ? "TRY" : currencyCode,
  }).format(value);
}

function addDays(baseDate: string, days: number) {
  if (!baseDate) return "";

  const date = new Date(`${baseDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function calculateLine(quantity: number, enteredUnitPrice: number, vatRate: number, direction: InvoiceDirection, salesKind: SalesInvoiceKind) {
  if (direction === "SALES" && salesKind === "RETAIL") {
    const grossUnitPrice = enteredUnitPrice;
    const netUnitPrice = vatRate > 0 ? grossUnitPrice / (1 + vatRate / 100) : grossUnitPrice;
    const grossTotal = quantity * grossUnitPrice;
    const subtotal = quantity * netUnitPrice;
    const vatTotal = grossTotal - subtotal;
    return { netUnitPrice, grossUnitPrice, subtotal, vatTotal, grandTotal: grossTotal };
  }

  const netUnitPrice = enteredUnitPrice;
  const subtotal = quantity * netUnitPrice;
  const vatTotal = subtotal * (vatRate / 100);
  return { netUnitPrice, grossUnitPrice: netUnitPrice * (1 + vatRate / 100), subtotal, vatTotal, grandTotal: subtotal + vatTotal };
}

export function InvoiceForm({
  customers,
  suppliers,
  products,
  nextInvoiceNo,
  initialDirection = "SALES",
  initialSalesKind = "WHOLESALE",
  redirectPath,
  companyInfo,
}: {
  customers: PartyOption[];
  suppliers: PartyOption[];
  products: ProductOption[];
  nextInvoiceNo: string;
  initialDirection?: InvoiceDirection;
  initialSalesKind?: SalesInvoiceKind;
  redirectPath?: string;
  companyInfo: CompanyInfo;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "other">("general");
  const [direction] = useState<InvoiceDirection>(initialDirection);
  const [salesKind, setSalesKind] = useState<SalesInvoiceKind>(initialSalesKind);
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [invoiceNo, setInvoiceNo] = useState(nextInvoiceNo);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [currencyCode, setCurrencyCode] = useState("TRY");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<LineItem[]>([createLineItem(products[0], initialDirection)]);

  const selectedParty = useMemo(() => {
    return direction === "SALES" ? customers.find((item) => item.id === customerId) ?? null : suppliers.find((item) => item.id === supplierId) ?? null;
  }, [customerId, customers, direction, supplierId, suppliers]);

  const preview = useMemo(() => {
    const lines = items.map((item, index) => {
      const product = products.find((entry) => entry.id === item.productId);
      const quantity = Number(item.quantity || 0);
      const enteredUnitPrice = Number(item.unitPrice || 0);
      const vatRate = Number(item.vatRate || 0);
      const totals = calculateLine(quantity, enteredUnitPrice, vatRate, direction, salesKind);
      return {
        id: item.id,
        lineNo: index + 1,
        code: product?.code ?? "",
        name: product?.name ?? "Ürün seçilmedi",
        quantity,
        vatRate,
        enteredUnitPrice,
        ...totals,
      };
    });

    const subtotal = lines.reduce((sum, item) => sum + item.subtotal, 0);
    const vatTotal = lines.reduce((sum, item) => sum + item.vatTotal, 0);
    const grandTotal = lines.reduce((sum, item) => sum + item.grandTotal, 0);
    return { lines, subtotal, vatTotal, grandTotal };
  }, [direction, items, products, salesKind]);

  const vatBreakdown = useMemo(() => {
    const map = new Map<number, number>();
    for (const line of preview.lines) {
      map.set(line.vatRate, (map.get(line.vatRate) ?? 0) + line.vatTotal);
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [preview.lines]);

  function updateLine(id: string, patch: Partial<LineItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function changeProduct(id: string, productId: string) {
    const product = products.find((item) => item.id === productId);
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              productId,
              unitPrice: String(product ? (direction === "SALES" ? product.salePrice : product.purchasePrice) : 0),
              vatRate: String(product?.vatRate ?? 20),
            }
          : item,
      ),
    );
  }

  function addLine() {
    setItems((current) => [...current, createLineItem(products[0], direction)]);
  }

  function addProductToLines(product: ProductOption) {
    setItems((current) => {
      const existingLine = current.find((line) => line.productId === product.id);
      if (existingLine) {
        return current.map((line) =>
          line.id === existingLine.id
            ? {
                ...line,
                quantity: String((Number(line.quantity || 0) || 0) + 1),
              }
            : line,
        );
      }

      return [
        ...current,
        {
          id: createClientId(),
          productId: product.id,
          quantity: "1",
          unitPrice: String(direction === "SALES" ? product.salePrice : product.purchasePrice),
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

  function removeLine(id: string) {
    setItems((current) => (current.length === 1 ? current : current.filter((item) => item.id !== id)));
  }

  function buildNote() {
    const parts = [
      direction === "SALES" ? `Satış tipi: ${salesKind === "WHOLESALE" ? "Toptan Satış Faturası (KDV Hariç)" : "Perakende Satış Faturası (KDV Dahil)"}` : "Alış faturası",
      category.trim() ? `Kategori: ${category.trim()}` : "",
      description.trim(),
    ];

    return parts.filter(Boolean).join("\n");
  }

  function resetForNew(nextNo: string) {
    setInvoiceNo(nextNo);
    setItems([createLineItem(products[0], direction)]);
    setDescription("");
    setCategory("");
    setDueDate("");
    setMessage("Fatura oluşturuldu.");
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!products.length) {
      setError("Fatura oluşturmak için önce ürün veya hizmet tanımlayın.");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const submitMode = submitter?.dataset.mode === "saveAndNew" ? "saveAndNew" : "save";

    const response = await fetch("/api/panel/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        direction,
        salesInvoiceKind: direction === "SALES" ? salesKind : null,
        invoiceNo,
        customerId: direction === "SALES" ? customerId : null,
        supplierId: direction === "PURCHASE" ? supplierId : null,
        issueDate,
        deliveryDate,
        dueDate,
        currencyCode,
        note: buildNote(),
        items: preview.lines.map((line, index) => ({
          productId: items[index]?.productId,
          quantity: line.quantity,
          unitPrice: line.netUnitPrice,
          vatRate: line.vatRate,
        })),
      }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.error ?? "Fatura oluşturulamadı.");
      setBusy(false);
      return;
    }

    const nextNo = result?.data?.nextInvoiceNo ?? invoiceNo;
    router.refresh();

    if (submitMode === "save" && redirectPath) {
      router.push(redirectPath);
      return;
    }

    resetForNew(nextNo);
    setBusy(false);
  }

  const headerTitle =
    direction === "SALES"
      ? salesKind === "WHOLESALE"
        ? "Toptan Satış Faturası"
        : "Perakende Satış Faturası"
      : "Alış Faturası";
  const headerBadge = direction === "SALES" ? (salesKind === "WHOLESALE" ? "KDV Hariç" : "KDV Dahil") : "Girdi faturası";
  const linePriceLabel = direction === "SALES" && salesKind === "RETAIL" ? "Birim fiyat (KDV dahil)" : "Birim fiyat";

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-4 rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Belge Düzeni</p>
            <h3 className="mt-1 font-display text-[1.7rem] font-extrabold tracking-tight text-slate-900">{headerTitle}</h3>
            <p className="mt-1 text-sm text-slate-500">Basit kullanım için cari seçimi, belge bilgileri, kalemler ve toplamlar aynı akışta tutuldu.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-600">{headerBadge}</span>
            <button type="button" onClick={() => setShowPreview(true)} className="rounded-[10px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
              GİB önizleme
            </button>
            <button type="button" onClick={() => setScannerOpen(true)} className="rounded-[10px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Barkod Okut
            </button>
            <button type="submit" data-mode="saveAndNew" disabled={busy} className="rounded-[10px] border border-emerald-200 bg-emerald-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-700 disabled:opacity-60">
              Kaydet ve Yeni Ekle
            </button>
            <button type="submit" data-mode="save" disabled={busy} className="rounded-[10px] bg-[var(--brand)] px-4 py-2.5 text-sm font-extrabold text-white hover:bg-[var(--brand-strong)] disabled:opacity-60">
              Kaydet
            </button>
            {redirectPath ? (
              <Link href={redirectPath} className="rounded-[10px] border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Vazgeç
              </Link>
            ) : null}
          </div>
        </div>
        {direction === "SALES" ? (
          <section className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setSalesKind("WHOLESALE")}
              className={`rounded-[16px] border px-5 py-4 text-left transition ${
                salesKind === "WHOLESALE" ? "border-[var(--brand)] bg-rose-50 shadow-[0_10px_24px_rgba(190,24,45,0.08)]" : "border-[var(--line)] bg-white hover:bg-slate-50"
              }`}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Satış Türü</p>
              <h3 className="mt-2 text-[1.25rem] font-extrabold text-slate-900">Toptan Satış Faturası</h3>
              <p className="mt-1 text-sm text-slate-500">Net fiyat girilir, KDV sonradan eklenir.</p>
            </button>
            <button
              type="button"
              onClick={() => setSalesKind("RETAIL")}
              className={`rounded-[16px] border px-5 py-4 text-left transition ${
                salesKind === "RETAIL" ? "border-[var(--brand)] bg-amber-50 shadow-[0_10px_24px_rgba(180,83,9,0.08)]" : "border-[var(--line)] bg-white hover:bg-slate-50"
              }`}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Satış Türü</p>
              <h3 className="mt-2 text-[1.25rem] font-extrabold text-slate-900">Perakende Satış Faturası</h3>
              <p className="mt-1 text-sm text-slate-500">KDV dahil fiyat girilir, sistem net tutarı otomatik çözer.</p>
            </button>
          </section>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.02fr_1.1fr]">
          <section className="rounded-[16px] border border-[var(--line)] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="border-b border-[var(--line)] px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Cari Bilgisi</p>
              <h3 className="mt-1 text-[1.35rem] font-extrabold text-slate-900">{direction === "SALES" ? "Müşteri" : "Tedarikçi"} kartı</h3>
            </div>
            <div className="space-y-4 px-5 py-5">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-600">{direction === "SALES" ? "Müşteri seç" : "Tedarikçi seç"}</span>
                {direction === "SALES" ? (
                  <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} required>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>{customer.code} - {customer.name}</option>
                    ))}
                  </select>
                ) : (
                  <select value={supplierId} onChange={(event) => setSupplierId(event.target.value)} required>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>{supplier.code} - {supplier.name}</option>
                    ))}
                  </select>
                )}
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Cari kodu</p>
                  <p className="mt-2 text-sm font-extrabold text-slate-900">{selectedParty?.code ?? "-"}</p>
                </div>
                <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Vergi / Kimlik</p>
                  <p className="mt-2 text-sm font-extrabold text-slate-900">{selectedParty?.taxNumber ?? "Belirtilmedi"}</p>
                </div>
                <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Telefon</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{selectedParty?.phone ?? "Belirtilmedi"}</p>
                </div>
                <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">E-posta</p>
                  <p className="mt-2 break-all text-sm font-semibold text-slate-700">{selectedParty?.email ?? "Belirtilmedi"}</p>
                </div>
              </div>

              <div className="rounded-[12px] border border-dashed border-[var(--line)] bg-slate-50 px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Adres</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">{selectedParty?.address ?? "Adres bilgisi yok"}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {[selectedParty?.district, selectedParty?.city, selectedParty?.country].filter(Boolean).join(" / ") || "Şehir bilgisi yok"}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link href={direction === "SALES" ? "/panel/cari/musteri/yeni" : "/panel/cari/tedarikci/yeni"} className="rounded-[10px] border border-[var(--line)] bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  Yeni cari kartı
                </Link>
                <Link href="/panel/cari" className="rounded-[10px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-white">
                  Cari merkezine dön
                </Link>
              </div>
            </div>
          </section>

          <section className="rounded-[16px] border border-[var(--line)] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="border-b border-[var(--line)] px-5 py-4">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setActiveTab("general")} className={`rounded-[10px] px-4 py-2 text-sm font-bold ${activeTab === "general" ? "bg-[var(--brand)] text-white" : "bg-[var(--panel-soft)] text-slate-600"}`}>
                  Genel
                </button>
                <button type="button" onClick={() => setActiveTab("other")} className={`rounded-[10px] px-4 py-2 text-sm font-bold ${activeTab === "other" ? "bg-[var(--brand)] text-white" : "bg-[var(--panel-soft)] text-slate-600"}`}>
                  Diğer
                </button>
              </div>
            </div>

            <div className="px-5 py-5">
              {activeTab === "general" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-600">Fatura tarihi</span>
                    <input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} required />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-600">Sevk tarihi</span>
                    <input type="date" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-600">Vade tarihi</span>
                    <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-600">Fatura numarası</span>
                    <input value={invoiceNo} onChange={(event) => setInvoiceNo(event.target.value)} required />
                  </label>
                  <div className="md:col-span-2">
                    <p className="mb-2 text-sm font-semibold text-slate-600">Hızlı vade</p>
                    <div className="flex flex-wrap gap-2">
                      {[30, 45, 60, 90, 120].map((day) => (
                        <button key={day} type="button" onClick={() => setDueDate(addDays(issueDate, day))} className="rounded-[10px] border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 text-sm font-bold text-slate-700 hover:bg-white">
                          {day} gün
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-600">Belge para birimi</span>
                    <select value={currencyCode} onChange={(event) => setCurrencyCode(event.target.value)}>
                      <option value="TRY">TL</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </label>
                  <div className="rounded-[12px] border border-dashed border-[var(--line)] bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    {direction === "SALES" && salesKind === "RETAIL"
                      ? "Perakende faturada birim fiyat alanına KDV dahil tutar girilir. Sistem kayıt sırasında net tutarı otomatik hesaplar."
                      : "Toptan satış ve alış faturalarında birim fiyat net tutar olarak işlenir."}
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-600">Kategori</span>
                    <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Örn. İç piyasa satışı" />
                  </label>
                  <div className="rounded-[12px] border border-dashed border-[var(--line)] bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Gelişmiş e-Fatura senaryo alanları ve ek dokümanlar sonraki turda bu sekmede genişletilebilir.
                  </div>
                  <label className="block space-y-2 md:col-span-2">
                    <span className="text-sm font-semibold text-slate-600">Açıklama</span>
                    <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={7} placeholder="Belge açıklaması, teslim notu veya iç not" />
                  </label>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <section className="rounded-[16px] border border-[var(--line)] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Kalemler</p>
                <h3 className="mt-1 text-[1.35rem] font-extrabold text-slate-900">Fatura satırları</h3>
              </div>
              <button type="button" onClick={addLine} className="rounded-[10px] border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Satır ekle
              </button>
            </div>

            <div className="overflow-x-auto px-5 py-5">
              <div className="min-w-[940px] space-y-3">
                <div className="grid grid-cols-[2.2fr_0.7fr_1fr_0.7fr_0.95fr_auto] gap-3 rounded-[12px] bg-[var(--panel-soft)] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  <span>Ürün / Hizmet</span>
                  <span>Miktar</span>
                  <span>{linePriceLabel}</span>
                  <span>KDV</span>
                  <span>Toplam</span>
                  <span></span>
                </div>

                {items.map((item, index) => {
                  const line = preview.lines[index];
                  return (
                    <div key={item.id} className="grid grid-cols-[2.2fr_0.7fr_1fr_0.7fr_0.95fr_auto] gap-3 rounded-[14px] border border-[var(--line)] bg-white px-4 py-4">
                      <label className="block space-y-2">
                        <span className="text-xs font-semibold text-slate-500">Kalem #{index + 1}</span>
                        <select value={item.productId} onChange={(event) => changeProduct(item.id, event.target.value)} required>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>{product.code} - {product.name}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block space-y-2">
                        <span className="text-xs font-semibold text-slate-500">Miktar</span>
                        <input type="number" step="0.001" value={item.quantity} onChange={(event) => updateLine(item.id, { quantity: event.target.value })} required />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-xs font-semibold text-slate-500">{linePriceLabel}</span>
                        <input type="number" step="0.01" value={item.unitPrice} onChange={(event) => updateLine(item.id, { unitPrice: event.target.value })} required />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-xs font-semibold text-slate-500">KDV %</span>
                        <input type="number" step="0.01" value={item.vatRate} onChange={(event) => updateLine(item.id, { vatRate: event.target.value })} required />
                      </label>
                      <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Satır toplamı</p>
                        <p className="mt-2 text-base font-extrabold text-slate-900">{formatMoney(line?.grandTotal ?? 0, currencyCode)}</p>
                        {direction === "SALES" && salesKind === "RETAIL" ? <p className="mt-1 text-xs text-slate-500">Net: {formatMoney(line?.subtotal ?? 0, currencyCode)}</p> : null}
                      </div>
                      <div className="flex items-end">
                        <button type="button" onClick={() => removeLine(item.id)} disabled={items.length === 1} className="rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-3 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                          Sil
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
          <aside className="rounded-[16px] border border-[var(--line)] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="border-b border-[var(--line)] px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Toplamlar</p>
              <h3 className="mt-1 text-[1.35rem] font-extrabold text-slate-900">Belge özeti</h3>
            </div>
            <div className="space-y-3 px-5 py-5">
              <div className="flex items-center justify-between border-b border-dashed border-[var(--line)] pb-3 text-sm">
                <span className="text-slate-500">Ara toplam</span>
                <span className="font-extrabold text-slate-900">{formatMoney(preview.subtotal, currencyCode)}</span>
              </div>
              {vatBreakdown.map(([rate, total]) => (
                <div key={rate} className="flex items-center justify-between border-b border-dashed border-[var(--line)] pb-3 text-sm">
                  <span className="text-slate-500">KDV %{rate}</span>
                  <span className="font-extrabold text-slate-900">{formatMoney(total, currencyCode)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-b border-dashed border-[var(--line)] pb-3 text-sm">
                <span className="text-slate-500">Toplam KDV</span>
                <span className="font-extrabold text-slate-900">{formatMoney(preview.vatTotal, currencyCode)}</span>
              </div>
              <div className="rounded-[14px] bg-[var(--panel-soft)] px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Genel toplam</p>
                <p className="mt-2 text-[2rem] font-extrabold tracking-tight text-slate-900">{formatMoney(preview.grandTotal, currencyCode)}</p>
                <p className="mt-2 text-xs text-slate-500">Para birimi: {currencyCode === "TRY" ? "TL" : currencyCode}</p>
              </div>

              <div className="rounded-[12px] border border-[var(--line)] bg-slate-50 px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Açıklama özeti</p>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{buildNote() || "Henüz açıklama eklenmedi."}</p>
              </div>

              <div className="space-y-2">
                {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
                {message ? <p className="text-sm font-semibold text-emerald-600">{message}</p> : null}
              </div>
            </div>
          </aside>
        </div>
      </form>

      {showPreview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">GİB Önizleme</p>
                <h3 className="mt-1 text-[1.3rem] font-extrabold text-slate-900">{headerTitle}</h3>
              </div>
              <button type="button" onClick={() => setShowPreview(false)} className="rounded-[10px] border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Kapat
              </button>
            </div>

            <div className="max-h-[calc(92vh-84px)] overflow-y-auto bg-slate-100 p-6">
              <div className="mx-auto w-full max-w-5xl rounded-[10px] border border-slate-300 bg-white p-8 shadow-[0_15px_45px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-8 border-b border-slate-200 pb-6 lg:flex-row lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Satıcı</p>
                    <h4 className="text-2xl font-extrabold text-slate-900">{companyInfo.name}</h4>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>Vergi No: {companyInfo.taxNumber ?? "-"}</p>
                      <p>{companyInfo.address ?? "Adres tanımlı değil"}</p>
                      <p>{[companyInfo.district, companyInfo.city].filter(Boolean).join(" / ") || "Şehir tanımlı değil"}</p>
                      <p>{companyInfo.phone ?? "Telefon yok"} - {companyInfo.email ?? "E-posta yok"}</p>
                      <p>Gönderici alias: {companyInfo.gibAlias ?? "Henüz yok"}</p>
                    </div>
                  </div>
                  <div className="min-w-[280px] rounded-[14px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Belge Bilgileri</p>
                    <div className="mt-3 grid gap-2 text-sm text-slate-700">
                      <div className="flex justify-between gap-3"><span>Fatura No</span><strong>{invoiceNo}</strong></div>
                      <div className="flex justify-between gap-3"><span>Fatura Tarihi</span><strong>{issueDate || "-"}</strong></div>
                      <div className="flex justify-between gap-3"><span>Sevk Tarihi</span><strong>{deliveryDate || "-"}</strong></div>
                      <div className="flex justify-between gap-3"><span>Vade Tarihi</span><strong>{dueDate || "-"}</strong></div>
                      <div className="flex justify-between gap-3"><span>Para Birimi</span><strong>{currencyCode}</strong></div>
                      <div className="flex justify-between gap-3"><span>Tür</span><strong>{headerTitle}</strong></div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-[14px] border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Alıcı</p>
                    <h4 className="mt-2 text-xl font-extrabold text-slate-900">{selectedParty?.name ?? "Cari seçilmedi"}</h4>
                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <p>Kodu: {selectedParty?.code ?? "-"}</p>
                      <p>Vergi No: {selectedParty?.taxNumber ?? "-"}</p>
                      <p>{selectedParty?.address ?? "Adres bilgisi yok"}</p>
                      <p>{[selectedParty?.district, selectedParty?.city, selectedParty?.country].filter(Boolean).join(" / ") || "Şehir bilgisi yok"}</p>
                      <p>{selectedParty?.phone ?? "Telefon yok"} - {selectedParty?.email ?? "E-posta yok"}</p>
                    </div>
                  </div>
                  <div className="rounded-[14px] border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Belge Notu</p>
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{buildNote() || "Not girilmedi."}</p>
                  </div>
                </div>

                <div className="mt-8 overflow-hidden rounded-[14px] border border-slate-200">
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="border-b border-slate-200 px-4 py-3 text-left font-bold">Kalem</th>
                        <th className="border-b border-slate-200 px-4 py-3 text-left font-bold">Ürün / Hizmet</th>
                        <th className="border-b border-slate-200 px-4 py-3 text-right font-bold">Miktar</th>
                        <th className="border-b border-slate-200 px-4 py-3 text-right font-bold">Net Birim</th>
                        <th className="border-b border-slate-200 px-4 py-3 text-right font-bold">KDV</th>
                        <th className="border-b border-slate-200 px-4 py-3 text-right font-bold">Tutar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.lines.map((line) => (
                        <tr key={line.id} className="odd:bg-white even:bg-slate-50/60">
                          <td className="border-b border-slate-100 px-4 py-3 text-slate-500">{line.lineNo}</td>
                          <td className="border-b border-slate-100 px-4 py-3">
                            <p className="font-semibold text-slate-800">{line.name}</p>
                            <p className="text-xs text-slate-500">{line.code}</p>
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3 text-right text-slate-700">{line.quantity}</td>
                          <td className="border-b border-slate-100 px-4 py-3 text-right text-slate-700">{formatMoney(line.netUnitPrice, currencyCode)}</td>
                          <td className="border-b border-slate-100 px-4 py-3 text-right text-slate-700">%{line.vatRate}</td>
                          <td className="border-b border-slate-100 px-4 py-3 text-right font-bold text-slate-900">{formatMoney(line.grandTotal, currencyCode)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 ml-auto w-full max-w-md rounded-[14px] border border-slate-200 bg-slate-50 p-5">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between"><span className="text-slate-500">Ara Toplam</span><strong>{formatMoney(preview.subtotal, currencyCode)}</strong></div>
                    {vatBreakdown.map(([rate, total]) => (
                      <div key={rate} className="flex items-center justify-between"><span className="text-slate-500">KDV %{rate}</span><strong>{formatMoney(total, currencyCode)}</strong></div>
                    ))}
                    <div className="flex items-center justify-between border-t border-slate-200 pt-3"><span className="text-slate-500">Toplam KDV</span><strong>{formatMoney(preview.vatTotal, currencyCode)}</strong></div>
                    <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-extrabold text-slate-900"><span>Genel Toplam</span><span>{formatMoney(preview.grandTotal, currencyCode)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <BarcodeScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} products={products} onDetected={handleBarcodeDetected} />
    </>
  );
}

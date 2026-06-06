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
  kind: "PRODUCT" | "SERVICE";
  barcode?: string | null;
  withholdingRate: number;
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
  withholdingRate: string;
};

type DocumentTab = "general" | "edevlet" | "other";

function createLineItem(product: ProductOption | undefined, direction: InvoiceDirection): LineItem {
  return {
    id: createClientId(),
    productId: product?.id ?? "",
    quantity: "1",
    unitPrice: String(product ? (direction === "SALES" ? product.salePrice : product.purchasePrice) : 0),
    vatRate: String(product?.vatRate ?? 20),
    withholdingRate: String(product?.withholdingRate ?? 0),
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

function calculateLine(
  quantity: number,
  enteredUnitPrice: number,
  vatRate: number,
  withholdingRate: number,
  direction: InvoiceDirection,
  salesKind: SalesInvoiceKind,
) {
  if (direction === "SALES" && salesKind === "RETAIL") {
    const grossUnitPrice = enteredUnitPrice;
    const netUnitPrice = vatRate > 0 ? grossUnitPrice / (1 + vatRate / 100) : grossUnitPrice;
    const grossTotal = quantity * grossUnitPrice;
    const subtotal = quantity * netUnitPrice;
    const vatTotal = grossTotal - subtotal;
    const withholdingAmount = subtotal * (withholdingRate / 100);
    return { netUnitPrice, grossUnitPrice, subtotal, vatTotal, withholdingAmount, grandTotal: grossTotal, payableTotal: grossTotal - withholdingAmount };
  }

  const netUnitPrice = enteredUnitPrice;
  const subtotal = quantity * netUnitPrice;
  const vatTotal = subtotal * (vatRate / 100);
  const withholdingAmount = subtotal * (withholdingRate / 100);
  return {
    netUnitPrice,
    grossUnitPrice: netUnitPrice * (1 + vatRate / 100),
    subtotal,
    vatTotal,
    withholdingAmount,
    grandTotal: subtotal + vatTotal,
    payableTotal: subtotal + vatTotal - withholdingAmount,
  };
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
  const [sendBusy, setSendBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [lastCreatedDocumentId, setLastCreatedDocumentId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [documentTab, setDocumentTab] = useState<DocumentTab>("general");
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
      const withholdingRate = Number(item.withholdingRate || 0);
      const totals = calculateLine(quantity, enteredUnitPrice, vatRate, withholdingRate, direction, salesKind);
      return {
        id: item.id,
        lineNo: index + 1,
        code: product?.code ?? "",
        name: product?.name ?? "Ürün seçilmedi",
        kind: product?.kind ?? "PRODUCT",
        quantity,
        vatRate,
        withholdingRate,
        enteredUnitPrice,
        ...totals,
      };
    });

    const subtotal = lines.reduce((sum, item) => sum + item.subtotal, 0);
    const vatTotal = lines.reduce((sum, item) => sum + item.vatTotal, 0);
    const withholdingTotal = lines.reduce((sum, item) => sum + item.withholdingAmount, 0);
    const grandTotal = lines.reduce((sum, item) => sum + item.grandTotal, 0);
    const payableTotal = lines.reduce((sum, item) => sum + item.payableTotal, 0);
    return { lines, subtotal, vatTotal, withholdingTotal, grandTotal, payableTotal };
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
              withholdingRate: String(product?.withholdingRate ?? 0),
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
          withholdingRate: String(product.withholdingRate ?? 0),
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
    setLastCreatedDocumentId(null);
  }

  async function sendToEdevlet(documentId: string) {
    setSendBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/panel/einvoice-documents/${documentId}/send`, {
        method: "POST",
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error ?? "Belge e-Devlet akışına gönderilemedi.");
      }

      setMessage("Belge e-Devlet / e-Fatura sistemine gönderildi.");
      router.refresh();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Belge e-Devlet akışına gönderilemedi.");
    } finally {
      setSendBusy(false);
    }
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
    const submitMode =
      submitter?.dataset.mode === "saveAndNew"
        ? "saveAndNew"
        : submitter?.dataset.mode === "saveAndSend"
          ? "saveAndSend"
          : "save";

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
            withholdingRate: line.withholdingRate,
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
    const eInvoiceDocumentId = result?.data?.eInvoiceDocumentId ?? null;
    router.refresh();
    setLastCreatedDocumentId(eInvoiceDocumentId);

    if (submitMode === "save" && redirectPath) {
      router.push(redirectPath);
      return;
    }

    if (submitMode === "saveAndSend" && eInvoiceDocumentId) {
      await sendToEdevlet(eInvoiceDocumentId);
      if (redirectPath) {
        router.push(redirectPath);
        return;
      }
    }
    if (submitMode === "saveAndSend" && !eInvoiceDocumentId) {
      setError("Satış kaydı oluştu ancak e-Belge taslağı hazırlanamadı. Önce e-Fatura ayarlarını kontrol edin.");
      setBusy(false);
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
  const headlineTotal = preview.withholdingTotal > 0 ? preview.payableTotal : preview.grandTotal;
  const partyTypeLabel = selectedParty?.taxNumber && selectedParty.taxNumber.length === 11 ? "Bireysel" : "Kurumsal";

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-3 rounded-sm border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Belge Düzeni</p>
            <h3 className="mt-1 font-display text-[1.35rem] font-extrabold tracking-tight text-slate-900">
              {headerTitle} <span className="text-sm font-bold text-slate-500">({headerBadge})</span>
            </h3>
            <p className="mt-1 text-xs text-slate-500">Cari, belge bilgileri ve kalemler tek ekranda yönetilir.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setShowPreview(true)} className="rounded-sm border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              GİB önizleme
            </button>
            <button type="button" onClick={() => setScannerOpen(true)} className="rounded-sm border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              Barkod okut
            </button>
            {direction === "SALES" ? (
              <button type="submit" data-mode="saveAndSend" disabled={busy || sendBusy} className="rounded-sm border border-sky-200 bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60">
                {busy || sendBusy ? "Hazırlanıyor..." : "Kaydet ve e-Devlet'e Gönder"}
              </button>
            ) : null}
            <button type="submit" data-mode="saveAndNew" disabled={busy} className="rounded-sm border border-emerald-200 bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
              Kaydet ve Yeni Ekle
            </button>
            <button type="submit" data-mode="save" disabled={busy} className="rounded-sm bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--brand-strong)] disabled:opacity-60">
              Kaydet
            </button>
            {redirectPath ? (
              <Link href={redirectPath} className="rounded-sm border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                Vazgeç
              </Link>
            ) : null}
          </div>
        </div>
        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-sm border border-[var(--line)] bg-white px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Seçilen cari</p>
            <p className="mt-1.5 text-sm font-extrabold text-slate-900">{selectedParty?.name ?? "Cari seçin"}</p>
            <p className="mt-1 text-xs text-slate-500">{selectedParty?.taxNumber ?? "Vergi bilgisi bekleniyor"}</p>
          </div>
          <div className="rounded-sm border border-[var(--line)] bg-white px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Belge özeti</p>
            <p className="mt-1.5 text-sm font-extrabold text-slate-900">{invoiceNo}</p>
            <p className="mt-1 text-xs text-slate-500">{issueDate || "Tarih seçin"}</p>
          </div>
          <div className="rounded-sm border border-[var(--line)] bg-white px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{preview.withholdingTotal > 0 ? "Tahsil edilecek" : "Genel toplam"}</p>
            <p className="mt-1.5 text-[1.15rem] font-extrabold tracking-tight text-slate-900">{formatMoney(headlineTotal, currencyCode)}</p>
            <p className="mt-1 text-xs text-slate-500">Para birimi: {currencyCode === "TRY" ? "TL" : currencyCode}</p>
          </div>
        </section>
        {direction === "SALES" ? (
          <section className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setSalesKind("WHOLESALE")}
              className={`rounded-sm border px-4 py-3 text-left transition ${
                salesKind === "WHOLESALE" ? "border-[var(--brand)] bg-rose-50" : "border-[var(--line)] bg-white hover:bg-slate-50"
              }`}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Satış Türü</p>
              <h3 className="mt-1.5 text-base font-extrabold text-slate-900">Toptan Satış Faturası</h3>
              <p className="mt-1 text-xs text-slate-500">Net fiyat girilir, KDV sonradan eklenir.</p>
            </button>
            <button
              type="button"
              onClick={() => setSalesKind("RETAIL")}
              className={`rounded-sm border px-4 py-3 text-left transition ${
                salesKind === "RETAIL" ? "border-[var(--brand)] bg-amber-50" : "border-[var(--line)] bg-white hover:bg-slate-50"
              }`}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Satış Türü</p>
              <h3 className="mt-1.5 text-base font-extrabold text-slate-900">Perakende Satış Faturası</h3>
              <p className="mt-1 text-xs text-slate-500">KDV dahil fiyat girilir, sistem net tutarı otomatik çözer.</p>
            </button>
          </section>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
          <div className="rounded-sm border border-[var(--line)] bg-white">
            <div className="border-b border-[var(--line)] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Cari Bilgisi</p>
              <h3 className="mt-1 text-lg font-extrabold text-slate-900">{direction === "SALES" ? "Müşteri kartı" : "Tedarikçi kartı"}</h3>
            </div>
            <div className="space-y-4 px-4 py-4">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-600">{direction === "SALES" ? "Müşteri seç" : "Tedarikçi seç"}</span>
                {direction === "SALES" ? (
                  <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} required>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                ) : (
                  <select value={supplierId} onChange={(event) => setSupplierId(event.target.value)} required>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                )}
              </label>

              <div className="flex flex-wrap items-center gap-5 text-sm">
                <label className="inline-flex items-center gap-2 font-medium text-slate-700">
                  <input type="radio" checked={partyTypeLabel === "Kurumsal"} readOnly className="h-4 w-4 accent-[var(--brand)]" />
                  Kurumsal
                </label>
                <label className="inline-flex items-center gap-2 font-medium text-slate-700">
                  <input type="radio" checked={partyTypeLabel === "Bireysel"} readOnly className="h-4 w-4 accent-[var(--brand)]" />
                  Bireysel
                </label>
              </div>

              <div className="rounded-sm border border-dashed border-[var(--line)] bg-slate-50 px-3 py-3">
                <p className="text-sm text-slate-700">{selectedParty?.address ?? "Adres bilgisi yok"}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1 border-b border-dashed border-[var(--line)] pb-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Ülke</p>
                  <p className="text-sm font-semibold text-slate-700">{selectedParty?.country ?? "Türkiye"}</p>
                </div>
                <div className="space-y-1 border-b border-dashed border-[var(--line)] pb-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Vergi dairesi</p>
                  <p className="text-sm font-semibold text-slate-700">{selectedParty?.taxOffice ?? "Belirtilmedi"}</p>
                </div>
                <div className="space-y-1 border-b border-dashed border-[var(--line)] pb-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">İl</p>
                  <p className="text-sm font-semibold text-slate-700">{selectedParty?.city ?? "Belirtilmedi"}</p>
                </div>
                <div className="space-y-1 border-b border-dashed border-[var(--line)] pb-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">İlçe</p>
                  <p className="text-sm font-semibold text-slate-700">{selectedParty?.district ?? "Belirtilmedi"}</p>
                </div>
                <div className="space-y-1 border-b border-dashed border-[var(--line)] pb-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Posta kodu</p>
                  <p className="text-sm font-semibold text-slate-700">{selectedParty?.postalCode ?? "Belirtilmedi"}</p>
                </div>
                <div className="space-y-1 border-b border-dashed border-[var(--line)] pb-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Vergi / Kimlik No</p>
                  <p className="text-sm font-semibold text-slate-700">{selectedParty?.taxNumber ?? "Belirtilmedi"}</p>
                </div>
              </div>

              <label className="inline-flex items-center gap-3 rounded-sm border border-[var(--line)] bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700">
                <input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" />
                Teslimat adresi farklı
              </label>
            </div>
          </div>

          <div className="rounded-sm border border-[var(--line)] bg-white">
            <div className="grid gap-4 px-4 py-4 md:grid-cols-[112px_1fr]">
              <div className="flex items-start justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-sm bg-gradient-to-br from-[var(--brand)] via-sky-600 to-indigo-700 text-[1.5rem] font-black text-white">
                  B360
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] pb-3">
                  {[
                    { id: "general" as const, label: "Genel" },
                    { id: "edevlet" as const, label: "e-Devlet" },
                    { id: "other" as const, label: "Diğer" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDocumentTab(tab.id)}
                      className={`border px-3 py-1.5 text-xs font-semibold transition ${documentTab === tab.id ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900"}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {documentTab === "general" ? (
                  <div className="grid gap-3">
                    <label className="grid gap-2 md:grid-cols-[170px_1fr] md:items-center">
                      <span className="text-sm font-semibold text-slate-600">Fatura Tarihi</span>
                      <input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} required />
                    </label>
                    <label className="grid gap-2 md:grid-cols-[170px_1fr] md:items-center">
                      <span className="text-sm font-semibold text-slate-600">Sevk Tarihi</span>
                      <input type="date" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} />
                    </label>
                    <label className="grid gap-2 md:grid-cols-[170px_1fr] md:items-center">
                      <span className="text-sm font-semibold text-slate-600">Vade Tarihi</span>
                      <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
                    </label>
                    <label className="grid gap-2 md:grid-cols-[170px_1fr] md:items-center">
                      <span className="text-sm font-semibold text-slate-600">Fatura Numarası</span>
                      <input value={invoiceNo} onChange={(event) => setInvoiceNo(event.target.value)} required />
                    </label>
                    <label className="grid gap-2 md:grid-cols-[170px_1fr] md:items-center">
                      <span className="text-sm font-semibold text-slate-600">Döviz</span>
                      <select value={currencyCode} onChange={(event) => setCurrencyCode(event.target.value)}>
                        <option value="TRY">TL</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </label>
                  </div>
                ) : null}

                {documentTab === "edevlet" ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-sm border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Alıcı VKN / TCKN</p>
                        <p className="mt-2 text-sm font-extrabold text-slate-900">{selectedParty?.taxNumber ?? "Belirtilmedi"}</p>
                      </div>
                      <div className="rounded-sm border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Gönderici GB</p>
                        <p className="mt-2 break-all text-sm font-extrabold text-slate-900">{companyInfo.gibAlias ?? "Henüz tanımlı değil"}</p>
                      </div>
                    </div>
                    <div className="rounded-sm border border-sky-100 bg-sky-50 px-3 py-3 text-sm leading-6 text-sky-900">
                      {direction === "SALES"
                        ? "Satış kaydı sonrası e-Belge taslağı hazırlanır. Kaydet ve e-Devlet'e Gönder ile belgeyi doğrudan e-Fatura veya e-Arşiv akışına çıkarabilirsin."
                        : "Alış faturaları burada e-Belge gönderimi yerine kayıt, eşleştirme ve belge takibi için kullanılır."}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Link href={direction === "SALES" ? "/panel/e-donusum/mukellef-sorgu" : "/panel/e-donusum"} className="rounded-sm border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        Mükellef sorgusunu aç
                      </Link>
                      <Link href="/panel/ayarlar/hizli-bilisim" className="rounded-sm border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white">
                        e-Belge ayarlarına git
                      </Link>
                    </div>
                  </div>
                ) : null}

                {documentTab === "other" ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block space-y-2">
                        <span className="text-sm font-semibold text-slate-600">Kategori</span>
                        <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Anahtar kelime ekleyin" />
                      </label>
                      <div className="rounded-sm border border-dashed border-[var(--line)] bg-slate-50 px-4 py-4">
                        <p className="text-sm font-semibold text-slate-700">Hızlı vade seç</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {[30, 45, 60, 90, 120].map((day) => (
                            <button key={day} type="button" onClick={() => setDueDate(addDays(issueDate, day))} className="rounded-sm border border-[var(--line)] bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                              {day} gün
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <label className="block space-y-2">
                      <span className="text-sm font-semibold text-slate-600">Açıklama</span>
                      <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} placeholder="Belge açıklaması, teslim notu veya iç not" />
                    </label>
                    <div className="rounded-sm border border-dashed border-[var(--line)] bg-slate-50 px-4 py-4 text-sm text-slate-600">
                      {direction === "SALES" && salesKind === "RETAIL"
                        ? "Perakende faturada birim fiyat alanı KDV dahil kabul edilir. Sistem net tutarı otomatik hesaplar."
                        : "Toptan satış ve alış faturalarında birim fiyat alanı net tutar olarak kullanılır."}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-sm border border-[var(--line)] bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-4 py-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Kalemler</p>
                <h3 className="mt-1 text-lg font-extrabold text-slate-900">Fatura satırları</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={addLine} className="rounded-sm border border-[var(--line)] bg-amber-400 px-3 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-300">
                  + Ekle
                </button>
                <button type="button" onClick={() => setScannerOpen(true)} className="rounded-sm border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  Barkod okut
                </button>
              </div>
            </div>

            <div className="space-y-3 px-4 py-4 md:hidden">
              {items.map((item, index) => {
                const line = preview.lines[index];
                return (
                  <div key={`${item.id}-mobile`} className="rounded-sm border border-[var(--line)] bg-[var(--panel-soft)] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Kalem #{index + 1}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">Ürün veya hizmet seç</p>
                      </div>
                      <button type="button" onClick={() => removeLine(item.id)} disabled={items.length === 1} className="rounded-sm border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50">
                        Sil
                      </button>
                    </div>
                    <div className="mt-4 space-y-3">
                      <label className="block space-y-2">
                        <span className="text-sm font-semibold text-slate-600">Kalem</span>
                        <select value={item.productId} onChange={(event) => changeProduct(item.id, event.target.value)} required>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>{product.code} - {product.name} {product.kind === "SERVICE" ? "(Hizmet)" : "(Ürün)"}</option>
                          ))}
                        </select>
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block space-y-2">
                          <span className="text-sm font-semibold text-slate-600">Miktar</span>
                          <input type="number" step="0.001" value={item.quantity} onChange={(event) => updateLine(item.id, { quantity: event.target.value })} required />
                        </label>
                        <label className="block space-y-2">
                          <span className="text-sm font-semibold text-slate-600">{linePriceLabel}</span>
                          <input type="number" step="0.01" value={item.unitPrice} onChange={(event) => updateLine(item.id, { unitPrice: event.target.value })} required />
                        </label>
                        <label className="block space-y-2">
                          <span className="text-sm font-semibold text-slate-600">KDV %</span>
                          <input type="number" step="0.01" value={item.vatRate} onChange={(event) => updateLine(item.id, { vatRate: event.target.value })} required />
                        </label>
                        <div className="rounded-sm border border-[var(--line)] bg-white px-4 py-3">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Tevkifat</p>
                          <p className="mt-2 text-base font-extrabold text-slate-900">%{Number(item.withholdingRate || 0).toLocaleString("tr-TR")}</p>
                          <p className="mt-1 text-xs text-slate-500">{line.kind === "SERVICE" ? formatMoney(line.withholdingAmount, currencyCode) : "Yok"}</p>
                        </div>
                      </div>
                      <div className="rounded-sm border border-slate-200 bg-white px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Satır Toplamı</p>
                        <p className="mt-2 text-lg font-extrabold text-slate-900">{formatMoney(line?.grandTotal ?? 0, currencyCode)}</p>
                        {line.kind === "SERVICE" && line.withholdingAmount > 0 ? (
                          <p className="mt-1 text-xs text-slate-500">Tahsil edilecek: {formatMoney(line.payableTotal, currencyCode)}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto px-4 py-4 md:block">
              <div className="min-w-[1320px] space-y-3">
                <div className="grid grid-cols-[54px_54px_2.1fr_0.74fr_0.76fr_0.95fr_0.8fr_0.95fr_0.9fr_0.9fr_1fr_1.3fr] gap-3 rounded-sm bg-[var(--panel-soft)] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  <span>#</span>
                  <span>İşlem</span>
                  <span>Ürün / Hizmet</span>
                  <span>Miktar</span>
                  <span>Birim</span>
                  <span>{linePriceLabel}</span>
                  <span>Vergi</span>
                  <span>Vergi Tutarı</span>
                  <span>İndirim</span>
                  <span>İnd. Tipi</span>
                  <span>Toplam</span>
                  <span>Açıklama</span>
                </div>

                {items.map((item, index) => {
                  const line = preview.lines[index];
                  return (
                     <div key={item.id} className="grid grid-cols-[54px_54px_2.1fr_0.74fr_0.76fr_0.95fr_0.8fr_0.95fr_0.9fr_0.9fr_1fr_1.3fr] gap-2 rounded-sm border border-[var(--line)] bg-white px-3 py-3">
                      <div className="rounded-sm bg-[var(--panel-soft)] px-3 py-3 text-center">
                        <p className="text-xs font-black text-slate-700">{index + 1}</p>
                      </div>
                      <div className="flex items-center justify-center">
                        <button type="button" onClick={() => removeLine(item.id)} disabled={items.length === 1} className="rounded-sm border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                          Sil
                        </button>
                      </div>
                      <label className="block space-y-2">
                        <span className="text-xs font-semibold text-slate-500">Kalem</span>
                        <select value={item.productId} onChange={(event) => changeProduct(item.id, event.target.value)} required>
                           {products.map((product) => (
                             <option key={product.id} value={product.id}>{product.code} - {product.name} {product.kind === "SERVICE" ? "(Hizmet)" : "(Ürün)"}</option>
                           ))}
                         </select>
                       </label>
                      <label className="block space-y-2">
                        <span className="text-xs font-semibold text-slate-500">Miktar</span>
                        <input type="number" step="0.001" value={item.quantity} onChange={(event) => updateLine(item.id, { quantity: event.target.value })} required />
                      </label>
                      <div className="rounded-sm border border-[var(--line)] bg-slate-50 px-3 py-3">
                        <p className="text-xs font-semibold text-slate-500">Birim</p>
                        <p className="mt-2 text-sm font-semibold text-slate-800">Adet</p>
                      </div>
                      <label className="block space-y-2">
                        <span className="text-xs font-semibold text-slate-500">{linePriceLabel}</span>
                        <input type="number" step="0.01" value={item.unitPrice} onChange={(event) => updateLine(item.id, { unitPrice: event.target.value })} required />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-xs font-semibold text-slate-500">Vergi</span>
                        <input type="number" step="0.01" value={item.vatRate} onChange={(event) => updateLine(item.id, { vatRate: event.target.value })} required />
                      </label>
                      <div className="rounded-sm border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Vergi Tutarı</p>
                        <p className="mt-2 text-base font-extrabold text-slate-900">{formatMoney(line?.vatTotal ?? 0, currencyCode)}</p>
                        <p className="mt-1 text-xs text-slate-500">%{Number(item.vatRate || 0).toLocaleString("tr-TR")} KDV</p>
                      </div>
                      <input defaultValue="" placeholder="0,00" className="rounded-sm border border-[var(--line)] bg-white px-3 py-3 text-right text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" />
                      <select defaultValue="Oran" className="rounded-sm border border-[var(--line)] bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10">
                        <option>Oran</option>
                        <option>Tutar</option>
                      </select>
                      <div className="rounded-sm border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Satır toplamı</p>
                        <p className="mt-2 text-base font-extrabold text-slate-900">{formatMoney(line?.grandTotal ?? 0, currencyCode)}</p>
                        {line.kind === "SERVICE" && line.withholdingAmount > 0 ? (
                          <p className="mt-1 text-xs text-slate-500">Tahsil edilecek: {formatMoney(line.payableTotal, currencyCode)}</p>
                        ) : direction === "SALES" && salesKind === "RETAIL" ? <p className="mt-1 text-xs text-slate-500">Net: {formatMoney(line?.subtotal ?? 0, currencyCode)}</p> : null}
                      </div>
                      <input defaultValue="" placeholder="Satır açıklaması" className="rounded-sm border border-[var(--line)] bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap justify-between gap-3 border-t border-[var(--line)] px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <Link href={direction === "SALES" ? "/panel/cari/musteri/yeni" : "/panel/cari/tedarikci/yeni"} className="rounded-sm border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  Yeni cari ekle
                </Link>
                <Link href="/panel/urunler/yeni" className="rounded-sm border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  Yeni ürün ekle
                </Link>
              </div>
              <button type="button" onClick={() => setShowPreview(true)} className="rounded-sm border border-slate-200 bg-[var(--panel-soft)] px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white">
                Son kontrolü aç
              </button>
            </div>
          </section>

        <section className="grid gap-4 pb-8 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-7">
            <div className="rounded-sm border border-[var(--line)] bg-white p-4">
              <label className="mb-3 block text-xs font-bold uppercase tracking-[0.18em] text-slate-700">Kategori Etiketleri</label>
              <div className="relative">
                <input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="Faturayı sınıflandırmak için etiket ekleyin..."
                  className="w-full rounded-sm border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </div>

            <div className="rounded-sm border border-[var(--line)] bg-white p-4">
              <label className="mb-3 block text-xs font-bold uppercase tracking-[0.18em] text-slate-700">Genel Fatura Açıklaması</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="Müşteriye gösterilecek notlar veya açıklamalar..."
                className="w-full resize-none rounded-sm border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-sm border border-slate-200 bg-white p-4">
              <div className="absolute left-0 top-0 h-2 w-full bg-[linear-gradient(90deg,#4f46e5,#14b8a6,#4f46e5)]" />
              <h3 className="mb-6 border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Özet Toplamlar</h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-1">
                  <span className="font-medium text-slate-500">Ara Toplam</span>
                  <span className="font-semibold text-slate-800">{formatMoney(preview.subtotal, currencyCode)}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="font-medium text-slate-500">Toplam İndirim</span>
                  <span className="font-semibold text-rose-500">- {formatMoney(0, currencyCode)}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="font-medium text-slate-500">KDV Toplamı</span>
                  <span className="font-semibold text-slate-800">{formatMoney(preview.vatTotal, currencyCode)}</span>
                </div>
                {preview.withholdingTotal > 0 ? (
                  <div className="flex items-center justify-between py-1">
                    <span className="font-medium text-slate-500">Toplam Tevkifat</span>
                    <span className="font-semibold text-sky-700">{formatMoney(preview.withholdingTotal, currencyCode)}</span>
                  </div>
                ) : null}
              </div>

              <div className="mt-6 border-t-2 border-dashed border-slate-200 pt-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Ödenecek Tutar</p>
                    <p className="inline-block border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-sm font-medium text-indigo-600">{currencyCode === "TRY" ? "TRY" : currencyCode}</p>
                  </div>
                  <span className="text-2xl font-black tracking-tight text-slate-900">
                    {formatMoney(preview.withholdingTotal > 0 ? preview.payableTotal : preview.grandTotal, currencyCode)}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
                {message ? <p className="text-sm font-semibold text-emerald-600">{message}</p> : null}
                {lastCreatedDocumentId && direction === "SALES" ? (
                  <button
                    type="button"
                    onClick={() => void sendToEdevlet(lastCreatedDocumentId)}
                    disabled={sendBusy}
                    className="inline-flex h-9 items-center rounded-sm bg-sky-600 px-3 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                  >
                    {sendBusy ? "Gönderiliyor..." : "e-Devlet Butonunu Aç ve Gönder"}
                  </button>
                ) : null}
              </div>
            </div>
          </aside>
        </section>
      </form>

      {showPreview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden border border-[var(--line)] bg-[var(--panel)]">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">GİB Önizleme</p>
                <h3 className="mt-1 text-[1.3rem] font-extrabold text-slate-900">{headerTitle}</h3>
              </div>
              <button type="button" onClick={() => setShowPreview(false)} className="border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Kapat
              </button>
            </div>

            <div className="max-h-[calc(92vh-84px)] overflow-y-auto bg-[var(--surface-muted)] p-6">
              <div className="mx-auto w-full max-w-5xl border border-[var(--line)] bg-[var(--panel)] p-8">
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
                  <div className="min-w-[280px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
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
                  <div className="border border-[var(--line)] p-4">
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
                  <div className="border border-[var(--line)] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Belge Notu</p>
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{buildNote() || "Not girilmedi."}</p>
                  </div>
                </div>

                <div className="mt-8 overflow-hidden border border-[var(--line)]">
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

                <div className="mt-8 ml-auto w-full max-w-md border border-[var(--line)] bg-[var(--panel-soft)] p-5">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between"><span className="text-slate-500">Ara Toplam</span><strong>{formatMoney(preview.subtotal, currencyCode)}</strong></div>
                      {vatBreakdown.map(([rate, total]) => (
                        <div key={rate} className="flex items-center justify-between"><span className="text-slate-500">KDV %{rate}</span><strong>{formatMoney(total, currencyCode)}</strong></div>
                      ))}
                      {preview.withholdingTotal > 0 ? (
                        <div className="flex items-center justify-between"><span className="text-slate-500">Tevkifat</span><strong>{formatMoney(preview.withholdingTotal, currencyCode)}</strong></div>
                      ) : null}
                      <div className="flex items-center justify-between border-t border-slate-200 pt-3"><span className="text-slate-500">Toplam KDV</span><strong>{formatMoney(preview.vatTotal, currencyCode)}</strong></div>
                      <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-extrabold text-slate-900"><span>Genel Toplam</span><span>{formatMoney(preview.grandTotal, currencyCode)}</span></div>
                      {preview.withholdingTotal > 0 ? (
                        <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-extrabold text-sky-900"><span>Tahsil edilecek</span><span>{formatMoney(preview.payableTotal, currencyCode)}</span></div>
                      ) : null}
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

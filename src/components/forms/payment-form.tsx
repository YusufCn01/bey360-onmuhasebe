"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type InvoiceOption = { id: string; invoiceNo: string };

export function PaymentForm({ invoices }: { invoices: InvoiceOption[] }) {
  const router = useRouter();
  const [direction, setDirection] = useState<"IN" | "OUT">("IN");
  const [method, setMethod] = useState("BANK");
  const [amount, setAmount] = useState("0");
  const [invoiceId, setInvoiceId] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/panel/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction, method, amount, invoiceId, description }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.error ?? "Finans hareketi oluşturulamadı.");
      setBusy(false);
      return;
    }
    setAmount("0");
    setInvoiceId("");
    setDescription("");
    router.refresh();
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <select value={direction} onChange={(e)=>setDirection(e.target.value as "IN" | "OUT")}><option value="IN">Tahsilat</option><option value="OUT">Ödeme</option></select>
      <select value={method} onChange={(e)=>setMethod(e.target.value)}><option value="BANK">Banka</option><option value="CASH">Nakit</option><option value="CREDIT_CARD">Kredi Kartı</option><option value="CHECK">Çek</option><option value="ONLINE">Online</option></select>
      <input type="number" step="0.01" value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="Tutar" required />
      <select value={invoiceId} onChange={(e)=>setInvoiceId(e.target.value)}><option value="">Belge seçmeden devam et</option>{invoices.map((invoice)=><option key={invoice.id} value={invoice.id}>{invoice.invoiceNo}</option>)}</select>
      <input value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Açıklama" />
      <div className="md:col-span-2 xl:col-span-5 flex items-center justify-between gap-3">
        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : <span />}
        <button disabled={busy} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white disabled:opacity-60">{busy ? "Kaydediliyor..." : "Hareket Ekle"}</button>
      </div>
    </form>
  );
}

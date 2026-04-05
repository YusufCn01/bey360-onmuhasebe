"use client";

import { useState } from "react";

export function SampleHizliEFaturaSendButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setBusy(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/panel/settings/hizli-bilisim/sample-send-efatura", { method: "POST" });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const invoiceNo = result?.data?.invoiceNo ? ` · Belge: ${result.data.invoiceNo}` : "";
        setError(`${result?.error ?? "Örnek e-Fatura gönderimi başarısız oldu."}${invoiceNo}`);
        return;
      }

      const invoiceNo = result?.data?.invoiceNo ? ` · Belge: ${result.data.invoiceNo}` : "";
      setMessage(`${result?.data?.note ?? "Örnek e-Fatura gönderildi."}${invoiceNo}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Örnek e-Fatura gönderiminde beklenmeyen bir hata oluştu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleSend}
        disabled={busy}
        className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm disabled:opacity-60"
      >
        {busy ? "Örnek e-Fatura hazırlanıyor..." : "Örnek e-Fatura Gönderimini Dene"}
      </button>
      <p className="text-xs text-slate-500">
        Bu işlem e-Fatura mükellefi test cariyle örnek satış faturası oluşturur ve PK alias çözümüyle Hızlı Bilişim’e gönderir.
      </p>
      {message ? <p className="text-sm font-semibold text-emerald-600">{message}</p> : null}
      {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}

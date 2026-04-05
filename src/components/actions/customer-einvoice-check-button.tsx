"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CustomerEInvoiceCheckButton({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck() {
    setBusy(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/panel/customers/${customerId}/einvoice-status`, {
        method: "POST",
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error ?? "e-Belge sorgusu tamamlanamadı.");
        setBusy(false);
        return;
      }

      setMessage(result?.data?.note ?? "e-Belge uygunluk sorgusu tamamlandı.");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "İstek sırasında beklenmeyen bir hata oluştu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleCheck}
        disabled={busy}
        className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
      >
        {busy ? "Sorgulanıyor..." : "e-Belge Sorgula"}
      </button>
      {message ? <p className="max-w-[260px] text-xs font-semibold text-emerald-600">{message}</p> : null}
      {error ? <p className="max-w-[260px] text-xs font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}

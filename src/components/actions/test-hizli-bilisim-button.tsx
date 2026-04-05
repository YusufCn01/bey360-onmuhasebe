"use client";

import { useState } from "react";

export function TestHizliBilisimButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTest() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/panel/settings/hizli-bilisim/test", { method: "POST" });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error ?? "Bağlantı testi başarısız oldu.");
        setBusy(false);
        return;
      }

      setMessage(result?.data?.note ?? "Bağlantı başarılı.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Bağlantı testi sırasında beklenmeyen bir hata oluştu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleTest}
        disabled={busy}
        className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-100 disabled:opacity-60"
      >
        {busy ? "Test ediliyor..." : "Bağlantıyı Test Et"}
      </button>
      <p className="text-xs text-slate-500">Başarılı test sonrasında dönen GB, ünvan ve VKN bilgisi e-Fatura ayarlarına otomatik yazılır.</p>
      {message ? <p className="text-sm font-semibold text-emerald-600">{message}</p> : null}
      {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}

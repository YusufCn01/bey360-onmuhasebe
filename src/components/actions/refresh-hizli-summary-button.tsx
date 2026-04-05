"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefreshHizliSummaryButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRefresh() {
    setBusy(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/panel/settings/hizli-bilisim/refresh-summary", { method: "POST" });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error ?? "Kontör bilgisi alınamadı.");
        setBusy(false);
        return;
      }

      setMessage(
        `Kontör güncellendi: ${result?.data?.creditCount ?? "-"}${typeof result?.data?.totalCredit === "number" ? ` / Toplam: ${result.data.totalCredit}` : ""}`,
      );
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Kontör sorgusu sırasında beklenmeyen bir hata oluştu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleRefresh}
        disabled={busy}
        className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-100 disabled:opacity-60"
      >
        {busy ? "Kontör çekiliyor..." : "Kontörü Güncelle"}
      </button>
      <p className="text-xs text-slate-500">Kalan kontör, toplam kredi ve panel sayıları servis üzerinden yeniden okunur.</p>
      {message ? <p className="text-sm font-semibold text-emerald-600">{message}</p> : null}
      {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}

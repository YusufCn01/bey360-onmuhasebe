"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SendEInvoiceButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/panel/einvoice-documents/${documentId}/send`, { method: "POST" });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error ?? "Belge gönderilemedi.");
        setBusy(false);
        return;
      }

      setSuccess("Belge gönderildi.");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gönderim sırasında beklenmeyen bir hata oluştu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={handleSend} disabled={busy} className="rounded-xl bg-[var(--brand)] px-4 py-2 text-xs font-black text-white disabled:opacity-60">
        {busy ? "Gönderiliyor..." : "Gönder"}
      </button>
      {success ? <p className="text-xs font-semibold text-emerald-600">{success}</p> : null}
      {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}

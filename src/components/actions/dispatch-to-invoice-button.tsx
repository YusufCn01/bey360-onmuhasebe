"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DispatchToInvoiceButton({ dispatchNoteId }: { dispatchNoteId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/panel/dispatch-notes/${dispatchNoteId}/invoice`, { method: "POST" });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setError(result?.error ?? "İrsaliye faturaya dönüştürülemedi.");
      setBusy(false);
      return;
    }

    router.refresh();
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={handleClick} disabled={busy} className="rounded-xl bg-[var(--brand)] px-4 py-2 text-xs font-black text-white disabled:opacity-60">
        {busy ? "Oluşturuluyor..." : "Faturaya Çevir"}
      </button>
      {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}

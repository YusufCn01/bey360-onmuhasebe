"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CrmNoteForm({
  leadId,
  redirectTo,
}: {
  leadId: string;
  redirectTo: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch("/api/panel/crm/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, content }),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      setError(result?.error ?? result?.error?.message ?? "Not kaydedilemedi.");
      setBusy(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Not içeriği</span>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={8}
          required
          className="min-h-40 w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)]"
          placeholder="Görüşme özeti, alınan aksiyon veya müşterinin geri bildirimi..."
        />
      </label>

      <div className="flex items-center justify-between gap-3">
        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : <span />}
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-black text-white hover:bg-[var(--brand-strong)] disabled:opacity-60"
        >
          {busy ? "Kaydediliyor..." : "Notu kaydet"}
        </button>
      </div>
    </form>
  );
}

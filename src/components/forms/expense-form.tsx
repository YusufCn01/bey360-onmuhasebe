"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ExpenseForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Genel Gider");
  const [amount, setAmount] = useState("0");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/panel/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category, amount, note }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.error ?? "Gider kaydı oluşturulamadı.");
      setBusy(false);
      return;
    }
    setTitle("");
    setAmount("0");
    setNote("");
    router.refresh();
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_1.5fr_auto]">
      <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Ofis kirası" required />
      <input value={category} onChange={(e)=>setCategory(e.target.value)} placeholder="Kategori" required />
      <input type="number" step="0.01" value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="0,00" required />
      <input value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Açıklama" />
      <button disabled={busy} className="rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-black text-white disabled:opacity-60">{busy ? "Kaydediliyor..." : "Gider Ekle"}</button>
      {error ? <p className="md:col-span-5 text-sm font-semibold text-rose-600">{error}</p> : null}
    </form>
  );
}

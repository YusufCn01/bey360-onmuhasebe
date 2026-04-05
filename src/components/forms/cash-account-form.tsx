"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CashAccountForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/panel/cash-accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, balance }) });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.error ?? "Kasa hesabı oluşturulamadı.");
      setBusy(false);
      return;
    }
    setName("");
    setBalance("0");
    router.refresh();
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-[1.4fr_1fr_auto]">
      <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Merkez Kasa" required />
      <input type="number" step="0.01" value={balance} onChange={(e)=>setBalance(e.target.value)} placeholder="0,00" required />
      <button disabled={busy} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white disabled:opacity-60">{busy ? "Kaydediliyor..." : "Kasa Ekle"}</button>
      {error ? <p className="md:col-span-3 text-sm font-semibold text-rose-600">{error}</p> : null}
    </form>
  );
}

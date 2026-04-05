"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BankAccountForm() {
  const router = useRouter();
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  const [balance, setBalance] = useState("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/panel/bank-accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bankName, iban, balance }) });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.error ?? "Banka hesabı oluşturulamadı.");
      setBusy(false);
      return;
    }
    setBankName("");
    setIban("");
    setBalance("0");
    router.refresh();
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-[1fr_1.6fr_1fr_auto]">
      <input value={bankName} onChange={(e)=>setBankName(e.target.value)} placeholder="İş Bankası" required />
      <input value={iban} onChange={(e)=>setIban(e.target.value)} placeholder="TR00 0000 0000 0000 0000 0000 01" required />
      <input type="number" step="0.01" value={balance} onChange={(e)=>setBalance(e.target.value)} placeholder="0,00" required />
      <button disabled={busy} className="rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-black text-white disabled:opacity-60">{busy ? "Kaydediliyor..." : "Banka Ekle"}</button>
      {error ? <p className="md:col-span-4 text-sm font-semibold text-rose-600">{error}</p> : null}
    </form>
  );
}

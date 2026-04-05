"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BranchForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/panel/settings/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code, city, district, phone }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.error ?? "Şube oluşturulamadı.");
      setBusy(false);
      return;
    }
    setName(""); setCode(""); setCity(""); setDistrict(""); setPhone("");
    router.refresh();
    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Ankara Şube" required />
      <input value={code} onChange={(e)=>setCode(e.target.value)} placeholder="ANK" required />
      <input value={city} onChange={(e)=>setCity(e.target.value)} placeholder="Ankara" />
      <input value={district} onChange={(e)=>setDistrict(e.target.value)} placeholder="Çankaya" />
      <input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="0312 000 00 00" />
      <div className="md:col-span-2 xl:col-span-5 flex items-center justify-between gap-3">
        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : <span />}
        <button disabled={busy} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white disabled:opacity-60">{busy ? "Ekleniyor..." : "Şube Ekle"}</button>
      </div>
    </form>
  );
}

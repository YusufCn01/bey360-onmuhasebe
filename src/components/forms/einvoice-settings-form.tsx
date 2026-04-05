"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Provider = "NONE" | "GIB" | "HIZLI_BILISIM";

export function EInvoiceSettingsForm({
  initial,
}: {
  initial: {
    provider: Provider;
    senderTitle: string;
    senderTaxNumber: string;
    gibAlias: string;
    archiveEnabled: boolean;
    autoSend: boolean;
    testMode: boolean;
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/panel/settings/einvoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.error ?? "e-Fatura ayarları kaydedilemedi.");
      setBusy(false);
      return;
    }
    setMessage("e-Fatura ayarları kaydedildi.");
    router.refresh();
    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <label className="space-y-2"><span className="text-sm font-semibold text-slate-600">Sağlayıcı</span><select value={form.provider} onChange={(e)=>setForm((c)=>({...c, provider:e.target.value as Provider}))}><option value="NONE">Henüz aktif değil</option><option value="GIB">Ücretsiz GİB e-Arşiv</option><option value="HIZLI_BILISIM">Hızlı Bilişim</option></select></label>
      <label className="space-y-2"><span className="text-sm font-semibold text-slate-600">Gönderici ünvanı</span><input value={form.senderTitle} onChange={(e)=>setForm((c)=>({...c,senderTitle:e.target.value}))} /></label>
      <label className="space-y-2"><span className="text-sm font-semibold text-slate-600">Vergi numarası</span><input value={form.senderTaxNumber} onChange={(e)=>setForm((c)=>({...c,senderTaxNumber:e.target.value}))} /></label>
      <label className="space-y-2 md:col-span-2 xl:col-span-2"><span className="text-sm font-semibold text-slate-600">Gönderici GB / URN</span><input value={form.gibAlias} onChange={(e)=>setForm((c)=>({...c,gibAlias:e.target.value}))} placeholder="urn:mail:defaultgb@hizlibilisimteknolojileri.net" /></label>
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.archiveEnabled} onChange={(e)=>setForm((c)=>({...c,archiveEnabled:e.target.checked}))} className="h-4 w-4" /> e-Arşiv akışını aktif tut</label>
        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.autoSend} onChange={(e)=>setForm((c)=>({...c,autoSend:e.target.checked}))} className="h-4 w-4" /> Fatura kesilince otomatik taslak hazırla</label>
        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.testMode} onChange={(e)=>setForm((c)=>({...c,testMode:e.target.checked}))} className="h-4 w-4" /> Test modunda çalış</label>
      </div>
      <div className="md:col-span-2 xl:col-span-3 flex items-center justify-between gap-3">
        <div>{error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}{message ? <p className="text-sm font-semibold text-emerald-600">{message}</p> : null}</div>
        <button disabled={busy} className="rounded-2xl bg-[var(--brand)] px-5 py-3 text-sm font-black text-white disabled:opacity-60">{busy ? "Kaydediliyor..." : "e-Fatura Ayarlarını Kaydet"}</button>
      </div>
    </form>
  );
}

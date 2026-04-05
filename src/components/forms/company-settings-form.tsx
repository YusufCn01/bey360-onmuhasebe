"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

type CompanySettingsFormState = {
  name: string;
  taxNumber: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  address: string;
  logoUrl: string;
  secondaryLogoUrl: string;
  signatureImageUrl: string;
  stampImageUrl: string;
  signatureName: string;
  signatureTitle: string;
};

const text = {
  saveFailed: "Firma bilgileri g\u00fcncellenemedi.",
  saved: "Firma bilgileri g\u00fcncellendi.",
  companyName: "Firma ad\u0131",
  taxNumber: "Vergi no",
  phone: "Telefon",
  email: "E-posta",
  city: "\u015eehir",
  district: "\u0130l\u00e7e",
  address: "Adres",
  primaryLogo: "Ana Logo",
  secondaryLogo: "\u0130kinci Logo",
  signatureImage: "\u0130mza G\u00f6rseli",
  stampImage: "Ka\u015fe / M\u00fch\u00fcr",
  signatureName: "\u0130mza ad\u0131",
  signatureTitle: "\u0130mza unvan\u0131",
  save: "Firma Bilgilerini Kaydet",
  saving: "Kaydediliyor...",
  primaryLogoHelp: "Belge ba\u015fl\u0131\u011f\u0131nda varsay\u0131lan ana logo olarak kullan\u0131l\u0131r.",
  secondaryLogoHelp: "\u015eube, entegrasyon veya partner logosu i\u00e7in ayr\u0131ld\u0131.",
  signatureHelp: "Belge alt\u0131ndaki imza alan\u0131nda g\u00f6r\u00fcn\u00fcr.",
  stampHelp: "\u00d6nizleme ve bask\u0131larda kar\u015f\u0131 imza alan\u0131nda ka\u015fe olarak g\u00f6sterilir.",
  companyLogoAlt: "Firma logosu",
  secondaryLogoAlt: "\u0130kinci logo",
  signatureAlt: "\u0130mza g\u00f6rseli",
  stampAlt: "Ka\u015fe veya m\u00fch\u00fcr",
};

function uploadCardClass() {
  return "rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] p-4";
}

function baseInputClass() {
  return "w-full rounded-[12px] border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(220,38,38,0.08)]";
}

export function CompanySettingsForm({
  initial,
}: {
  initial: CompanySettingsFormState;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateImageField(field: "logoUrl" | "secondaryLogoUrl" | "signatureImageUrl" | "stampImageUrl", file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((current) => ({ ...current, [field]: result }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/panel/settings/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error ?? text.saveFailed);
      }

      setMessage(text.saved);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : text.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-600">{text.companyName}</span>
          <input className={baseInputClass()} value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} required />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-600">{text.taxNumber}</span>
          <input className={baseInputClass()} value={form.taxNumber} onChange={(e) => setForm((c) => ({ ...c, taxNumber: e.target.value }))} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-600">{text.phone}</span>
          <input className={baseInputClass()} value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-600">{text.email}</span>
          <input className={baseInputClass()} type="email" value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-600">{text.city}</span>
          <input className={baseInputClass()} value={form.city} onChange={(e) => setForm((c) => ({ ...c, city: e.target.value }))} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-600">{text.district}</span>
          <input className={baseInputClass()} value={form.district} onChange={(e) => setForm((c) => ({ ...c, district: e.target.value }))} />
        </label>
        <label className="space-y-2 md:col-span-2 xl:col-span-3">
          <span className="text-sm font-semibold text-slate-600">{text.address}</span>
          <textarea className={baseInputClass()} rows={3} value={form.address} onChange={(e) => setForm((c) => ({ ...c, address: e.target.value }))} />
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <div className={uploadCardClass()}>
          <p className="text-sm font-bold text-slate-700">{text.primaryLogo}</p>
          <input className="mt-3 text-sm" type="file" accept="image/*" onChange={(event) => updateImageField("logoUrl", event.target.files?.[0] ?? null)} />
          {form.logoUrl ? (
            <Image src={form.logoUrl} alt={text.companyLogoAlt} width={160} height={72} unoptimized className="mt-4 h-16 w-auto rounded-[10px] border border-slate-200 bg-white p-2" />
          ) : (
            <p className="mt-4 text-xs text-slate-500">{text.primaryLogoHelp}</p>
          )}
        </div>

        <div className={uploadCardClass()}>
          <p className="text-sm font-bold text-slate-700">{text.secondaryLogo}</p>
          <input className="mt-3 text-sm" type="file" accept="image/*" onChange={(event) => updateImageField("secondaryLogoUrl", event.target.files?.[0] ?? null)} />
          {form.secondaryLogoUrl ? (
            <Image src={form.secondaryLogoUrl} alt={text.secondaryLogoAlt} width={160} height={72} unoptimized className="mt-4 h-16 w-auto rounded-[10px] border border-slate-200 bg-white p-2" />
          ) : (
            <p className="mt-4 text-xs text-slate-500">{text.secondaryLogoHelp}</p>
          )}
        </div>

        <div className={uploadCardClass()}>
          <p className="text-sm font-bold text-slate-700">{text.signatureImage}</p>
          <input className="mt-3 text-sm" type="file" accept="image/*" onChange={(event) => updateImageField("signatureImageUrl", event.target.files?.[0] ?? null)} />
          {form.signatureImageUrl ? (
            <Image src={form.signatureImageUrl} alt={text.signatureAlt} width={160} height={72} unoptimized className="mt-4 h-16 w-auto rounded-[10px] border border-slate-200 bg-white p-2 object-contain" />
          ) : (
            <p className="mt-4 text-xs text-slate-500">{text.signatureHelp}</p>
          )}
        </div>

        <div className={uploadCardClass()}>
          <p className="text-sm font-bold text-slate-700">{text.stampImage}</p>
          <input className="mt-3 text-sm" type="file" accept="image/*" onChange={(event) => updateImageField("stampImageUrl", event.target.files?.[0] ?? null)} />
          {form.stampImageUrl ? (
            <Image src={form.stampImageUrl} alt={text.stampAlt} width={160} height={72} unoptimized className="mt-4 h-16 w-auto rounded-[10px] border border-slate-200 bg-white p-2 object-contain" />
          ) : (
            <p className="mt-4 text-xs text-slate-500">{text.stampHelp}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-600">{text.signatureName}</span>
          <input className={baseInputClass()} value={form.signatureName} onChange={(e) => setForm((c) => ({ ...c, signatureName: e.target.value }))} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-600">{text.signatureTitle}</span>
          <input className={baseInputClass()} value={form.signatureTitle} onChange={(e) => setForm((c) => ({ ...c, signatureTitle: e.target.value }))} />
        </label>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
          {message ? <p className="text-sm font-semibold text-emerald-600">{message}</p> : null}
        </div>
        <button disabled={busy} className="rounded-2xl bg-[var(--brand)] px-5 py-3 text-sm font-black text-white disabled:opacity-60">
          {busy ? text.saving : text.save}
        </button>
      </div>
    </form>
  );
}

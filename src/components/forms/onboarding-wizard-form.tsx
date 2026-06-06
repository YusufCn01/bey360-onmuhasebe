"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { uploadImage } from "@/lib/client-upload";

type OnboardingWizardFormProps = {
  initial: {
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
    createCustomer: boolean;
    createProduct: boolean;
    customerName: string;
    customerEmail: string;
    productName: string;
    productPrice: string;
    currentStep: number;
  };
};

const steps = [
  { key: "company", label: "Firma" },
  { key: "branding", label: "Görünüm" },
  { key: "records", label: "İlk Kayıtlar" },
  { key: "finish", label: "Tamamla" },
] as const;

export function OnboardingWizardForm({ initial }: OnboardingWizardFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(Math.max(0, Math.min(initial.currentStep, steps.length - 1)));
  const [form, setForm] = useState({
    name: initial.name,
    taxNumber: initial.taxNumber,
    phone: initial.phone,
    email: initial.email,
    city: initial.city,
    district: initial.district,
    address: initial.address,
    logoUrl: initial.logoUrl,
    secondaryLogoUrl: initial.secondaryLogoUrl,
    signatureImageUrl: initial.signatureImageUrl,
    stampImageUrl: initial.stampImageUrl,
    signatureName: initial.signatureName,
    signatureTitle: initial.signatureTitle,
    createCustomer: initial.createCustomer,
    createProduct: initial.createProduct,
    customerName: initial.customerName,
    customerEmail: initial.customerEmail,
    productName: initial.productName,
    productPrice: initial.productPrice,
  });
  const [busy, setBusy] = useState(false);
  const [draftState, setDraftState] = useState<"idle" | "saving" | "saved">("idle");
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const firstSyncRef = useRef(true);

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  function nextStep() {
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function prevStep() {
    setStep((current) => Math.max(current - 1, 0));
  }

  async function updateImageField(field: "logoUrl" | "secondaryLogoUrl" | "signatureImageUrl" | "stampImageUrl", file: File | null) {
    if (!file) return;
    setUploadingField(field);
    setError(null);

    try {
      const url = await uploadImage(file, field);
      setForm((current) => ({ ...current, [field]: url }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Görsel yüklenemedi.");
    } finally {
      setUploadingField(null);
    }
  }

  useEffect(() => {
    if (firstSyncRef.current) {
      firstSyncRef.current = false;
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        setDraftState("saving");
        const response = await fetch("/api/panel/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "draft",
            currentStep: step,
            ...form,
          }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) {
          throw new Error(result?.error ?? "Taslak kaydedilemedi.");
        }
        setDraftState("saved");
      } catch {
        setDraftState("idle");
      }
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [form, step]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/panel/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "complete",
          currentStep: step,
          ...form,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error ?? "Kurulum tamamlanamadı.");
      }

      router.push("/panel");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Kurulum tamamlanamadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {steps.map((item, index) => (
              <span
                key={item.key}
                className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
                  index <= step ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {index + 1}. {item.label}
              </span>
            ))}
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-slate-500">%{Math.round(progress)}</span>
            <p className="text-[11px] font-semibold text-slate-400">
              {draftState === "saving" ? "Taslak kaydediliyor..." : draftState === "saved" ? "Taslak kaydedildi" : "Taslak izleniyor"}
            </p>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-[var(--brand)] transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {step === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Firma adı" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
          <Field label="Vergi no" value={form.taxNumber} onChange={(value) => setForm((current) => ({ ...current, taxNumber: value }))} />
          <Field label="Telefon" value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} />
          <Field label="E-posta" type="email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} />
          <Field label="Şehir" value={form.city} onChange={(value) => setForm((current) => ({ ...current, city: value }))} />
          <Field label="İlçe" value={form.district} onChange={(value) => setForm((current) => ({ ...current, district: value }))} />
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-slate-600">Adres</span>
            <textarea
              rows={3}
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[var(--brand)] focus:outline-none"
            />
          </label>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <UploadCard title="Ana logo" help="Belge başlığında ana logo olarak kullanılır." value={form.logoUrl} busy={uploadingField === "logoUrl"} onFileChange={(file) => updateImageField("logoUrl", file)} />
              <UploadCard title="İkinci logo" help="Şube, marka veya partner logosu için ayrıldı." value={form.secondaryLogoUrl} busy={uploadingField === "secondaryLogoUrl"} onFileChange={(file) => updateImageField("secondaryLogoUrl", file)} />
              <UploadCard title="İmza görseli" help="Belge altındaki imza alanında görünür." value={form.signatureImageUrl} busy={uploadingField === "signatureImageUrl"} onFileChange={(file) => updateImageField("signatureImageUrl", file)} />
              <UploadCard title="Kaşe / mühür" help="Baskı ve önizleme alanında kaşe olarak kullanılır." value={form.stampImageUrl} busy={uploadingField === "stampImageUrl"} onFileChange={(file) => updateImageField("stampImageUrl", file)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="İmza adı" value={form.signatureName} onChange={(value) => setForm((current) => ({ ...current, signatureName: value }))} />
              <Field label="İmza unvanı" value={form.signatureTitle} onChange={(value) => setForm((current) => ({ ...current, signatureTitle: value }))} />
            </div>

            <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-500">
              Dosya seçtiğinde görsel yüklenir ve kurulum taslağına eklenir. Sayfadan çıksan bile bu adım kaybolmaz.
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
            <p className="text-sm font-extrabold text-slate-950">Belge önizlemesi</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">Şablonlarda gözükecek temel görünüm burada hızlıca gözünün önüne gelir.</p>
            <div className="mt-4 rounded-[22px] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <PreviewLogo label="Ana logo" url={form.logoUrl} />
                <PreviewLogo label="İkinci logo" url={form.secondaryLogoUrl} />
              </div>
              <div className="mt-4 space-y-3">
                <p className="text-lg font-black text-slate-950">{form.name || "Firma adı"}</p>
                <p className="text-sm text-slate-500">{form.city || "Şehir"} · {form.email || "eposta@firma.com"}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <PreviewAsset label="İmza" url={form.signatureImageUrl} />
                  <PreviewAsset label="Kaşe" url={form.stampImageUrl} />
                </div>
                <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {form.signatureName || "Yetkili adı"} · {form.signatureTitle || "Yetkili unvanı"}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-slate-950">İlk müşteri kartı</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Kurulum biter bitmez bir müşteri kartı oluşturabilirsin.</p>
              </div>
              <input
                type="checkbox"
                checked={form.createCustomer}
                onChange={(event) => setForm((current) => ({ ...current, createCustomer: event.target.checked }))}
                className="mt-1 h-4 w-4 accent-[var(--brand)]"
              />
            </div>

            {form.createCustomer ? (
              <div className="mt-4 grid gap-3">
                <Field label="Müşteri adı" value={form.customerName} onChange={(value) => setForm((current) => ({ ...current, customerName: value }))} />
                <Field label="Müşteri e-postası" type="email" value={form.customerEmail} onChange={(value) => setForm((current) => ({ ...current, customerEmail: value }))} />
              </div>
            ) : null}
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-slate-950">İlk ürün kartı</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Stok akışını hızlandırmak için örnek bir ürün kartı açabilirsin.</p>
              </div>
              <input
                type="checkbox"
                checked={form.createProduct}
                onChange={(event) => setForm((current) => ({ ...current, createProduct: event.target.checked }))}
                className="mt-1 h-4 w-4 accent-[var(--brand)]"
              />
            </div>

            {form.createProduct ? (
              <div className="mt-4 grid gap-3">
                <Field label="Ürün adı" value={form.productName} onChange={(value) => setForm((current) => ({ ...current, productName: value }))} />
                <Field label="Satış fiyatı" type="number" value={form.productPrice} onChange={(value) => setForm((current) => ({ ...current, productPrice: value }))} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
          <p className="text-sm font-extrabold text-slate-950">Kurulum özeti</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryLine label="Firma" value={form.name || "-"} />
            <SummaryLine label="Şehir" value={form.city || "-"} />
            <SummaryLine label="Vergi no" value={form.taxNumber || "-"} />
            <SummaryLine label="E-posta" value={form.email || "-"} />
            <SummaryLine label="Logo" value={form.logoUrl ? "Hazır" : "Daha sonra eklenecek"} />
            <SummaryLine label="İmza" value={form.signatureImageUrl ? "Hazır" : "Daha sonra eklenecek"} />
            <SummaryLine label="Kaşe" value={form.stampImageUrl ? "Hazır" : "Daha sonra eklenecek"} />
            <SummaryLine label="İlk müşteri" value={form.createCustomer ? form.customerName || "Oluşturulacak" : "Atlandı"} />
            <SummaryLine label="İlk ürün" value={form.createProduct ? form.productName || "Oluşturulacak" : "Atlandı"} />
            <SummaryLine label="İmza yetkilisi" value={form.signatureName ? `${form.signatureName}${form.signatureTitle ? ` · ${form.signatureTitle}` : ""}` : "Henüz eklenmedi"} />
          </div>
          <p className="text-sm leading-6 text-slate-500">
            Bu adımı tamamladığında firma bilgilerin kaydedilir, seçtiğin ilk kayıtlar oluşturulur ve panel kullanıma hazır hale gelir.
          </p>
        </div>
      ) : null}

      {error ? <p className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={prevStep}
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700"
          >
            Geri
          </button>
        ) : null}

        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={nextStep}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-black text-white"
          >
            Devam et
          </button>
        ) : (
          <button
            type="submit"
            disabled={busy || uploadingField !== null}
            className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-black text-white shadow-[0_18px_30px_rgba(15,118,110,0.14)] disabled:opacity-60"
          >
            {busy ? "Kurulum tamamlanıyor..." : "Kurulumu tamamla"}
          </button>
        )}

        <button
          type="button"
          onClick={() => router.push("/panel")}
          className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700"
        >
          Şimdilik geç
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-[14px] border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--brand)] focus:outline-none"
      />
    </label>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

function PreviewLogo({ label, url }: { label: string; url: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[16px] border border-slate-200 bg-slate-50">
        {url ? (
          <Image src={url} alt={label} width={48} height={48} unoptimized className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Logo</span>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-700">{url ? "Hazır" : "Henüz eklenmedi"}</p>
      </div>
    </div>
  );
}

function PreviewAsset({ label, url }: { label: string; url: string }) {
  return (
    <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
      {url ? (
        <Image src={url} alt={label} width={180} height={80} unoptimized className="mt-3 h-20 w-auto rounded-[10px] border border-slate-200 bg-white p-2 object-contain" />
      ) : (
        <p className="mt-3 text-sm text-slate-500">Henüz eklenmedi</p>
      )}
    </div>
  );
}

function UploadCard({
  title,
  help,
  value,
  busy,
  onFileChange,
}: {
  title: string;
  help: string;
  value: string;
  busy: boolean;
  onFileChange: (file: File | null) => void;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-4">
      <p className="text-sm font-bold text-slate-700">{title}</p>
      <input className="mt-3 text-sm" type="file" accept="image/*" onChange={(event) => onFileChange(event.target.files?.[0] ?? null)} />
      {busy ? (
        <p className="mt-4 text-xs font-semibold text-slate-500">Yükleniyor...</p>
      ) : value ? (
        <Image src={value} alt={title} width={180} height={80} unoptimized className="mt-4 h-20 w-auto rounded-[10px] border border-slate-200 bg-white p-2 object-contain" />
      ) : (
        <p className="mt-4 text-xs text-slate-500">{help}</p>
      )}
    </div>
  );
}

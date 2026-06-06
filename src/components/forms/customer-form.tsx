"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const initialForm = {
  code: "",
  type: "2",
  title: "",
  firstName: "",
  lastName: "",
  address: "",
  country: "Türkiye",
  city: "",
  district: "",
  postalCode: "",
  taxOffice: "",
  taxNumber: "",
  phone: "",
  email: "",
  website: "",
  authorizedName: "",
  authorizedEmail: "",
  fax: "",
  category: "",
  currencyCode: "TRY",
  openingBalance: "0",
  phoneCountryCode: "+90",
  openingBalanceDate: new Date().toISOString().slice(0, 10),
  eInvoiceRegistered: false,
  eInvoiceAlias: "",
  eInvoiceCheckNote: "",
};

export function CustomerForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turmobKey, setTurmobKey] = useState("");
  const [turmobMessage, setTurmobMessage] = useState<string | null>(null);
  const [turmobError, setTurmobError] = useState<string | null>(null);
  const [turmobBusy, setTurmobBusy] = useState(false);

  const displayName = useMemo(() => {
    if (form.type === "2") {
      return form.title.trim() || "Ünvan girildiğinde burada görünecek";
    }

    const fullName = `${form.firstName} ${form.lastName}`.trim();
    return fullName || "Ad ve soyad girildiğinde burada görünecek";
  }, [form]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/panel/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setError(result?.error ?? "Müşteri kaydı oluşturulamadı.");
      setBusy(false);
      return;
    }

    setMessage("Müşteri kartı oluşturuldu.");
    setForm(initialForm);
    router.refresh();
    setBusy(false);
  }

  function getString(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
  }

  async function handleTurmobFill() {
    setTurmobMessage(null);
    setTurmobError(null);
    setTurmobBusy(true);
    try {
      if (!form.taxNumber.trim()) {
        throw new Error("VKN / TCKN girilmelidir.");
      }

      const response = await fetch("/api/panel/settings/hizli-bilisim/mukellef", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vknTckn: form.taxNumber, meslekMensubuKey: turmobKey || undefined }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error ?? "TÜRMOB sorgulaması başarısız oldu.");
      }

      const mukellef = (result?.data?.mukellef ?? {}) as Record<string, unknown>;
      const durum = (mukellef.durum ?? {}) as Record<string, unknown>;
      const durumSonuc = typeof durum.sonuc === "boolean" ? durum.sonuc : String(durum.sonuc ?? "").toLowerCase() === "true";
      const durumAciklama = getString(durum.durumKodAciklamasi) || getString(durum.hataDetayBilgisi);
      const adresList = Array.isArray(mukellef.adresBilgileri) ? (mukellef.adresBilgileri as Record<string, unknown>[]) : [];
      const adres = adresList[0] ?? {};
      const city = getString(adres.ilAdi);
      const district = getString(adres.ilceAdi);
      const street = [adres.mahalleSemt, adres.caddeSokak, adres.disKapiNo, adres.icKapiNo].map(getString).filter(Boolean).join(" ");

      const isIndividual = Boolean(getString(mukellef.tckn));
      const title = getString(mukellef.unvan) || getString(mukellef.kimlikUnvani);
      const firstName = getString(mukellef.ad);
      const lastName = getString(mukellef.soyad);
      const taxOffice = getString(mukellef.vergiDairesiAdi);

      setForm((current) => ({
        ...current,
        type: isIndividual ? "1" : "2",
        title: isIndividual ? current.title : title || current.title,
        firstName: isIndividual ? firstName || current.firstName : current.firstName,
        lastName: isIndividual ? lastName || current.lastName : current.lastName,
        taxOffice: taxOffice || current.taxOffice,
        city: city || current.city,
        district: district || current.district,
        address: street || current.address,
        eInvoiceRegistered: durumSonuc ? true : current.eInvoiceRegistered,
        eInvoiceCheckNote: durumSonuc ? `TÜRMOB doğrulama: ${durumAciklama || "Aktif"}` : current.eInvoiceCheckNote,
      }));

      setTurmobMessage("TÜRMOB bilgileri forma aktarıldı.");
    } catch (err) {
      setTurmobError(err instanceof Error ? err.message : "TÜRMOB sorgulaması sırasında hata oluştu.");
    } finally {
      setTurmobBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[16px] border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Cari Kartı</p>
              <h3 className="mt-1 text-[1.35rem] font-extrabold text-slate-900">Temel bilgiler</h3>
            </div>
            <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-right">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Görünecek ad</p>
              <p className="mt-1 text-sm font-extrabold text-slate-900">{displayName}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">Cari kodu</span>
              <input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="CR0001" required />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">Tipi</span>
              <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
                <option value="2">Kurumsal</option>
                <option value="1">Bireysel</option>
              </select>
            </label>

            {form.type === "2" ? (
              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-slate-600">Ünvanı</span>
                <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Örnek Ticaret Ltd. Şti." required />
              </label>
            ) : (
              <>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-600">Adı</span>
                  <input value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} placeholder="Ayşe" required />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-600">Soyadı</span>
                  <input value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} placeholder="Yılmaz" required />
                </label>
              </>
            )}

            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-600">Adres</span>
              <textarea value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} rows={4} placeholder="Mahalle, cadde, bina ve daire bilgisi" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">Ülke</span>
              <input value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} placeholder="Türkiye" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">İl</span>
              <input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} placeholder="İstanbul" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">İlçe</span>
              <input value={form.district} onChange={(event) => setForm((current) => ({ ...current, district: event.target.value }))} placeholder="Şişli" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">Posta kodu</span>
              <input value={form.postalCode} onChange={(event) => setForm((current) => ({ ...current, postalCode: event.target.value }))} placeholder="34394" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">Vergi dairesi</span>
              <input value={form.taxOffice} onChange={(event) => setForm((current) => ({ ...current, taxOffice: event.target.value }))} placeholder="Şişli" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">Vergi No / T.C. Kimlik No</span>
              <input value={form.taxNumber} onChange={(event) => setForm((current) => ({ ...current, taxNumber: event.target.value }))} placeholder="1234567890" />
            </label>

            <div className="md:col-span-2 rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">TÜRMOB</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">Mükellef bilgisiyle otomatik doldur</p>
              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                <label className="space-y-2">
                  <span className="text-xs font-semibold text-slate-600">Meslek Mensubu Key (opsiyonel)</span>
                  <input
                    value={turmobKey}
                    onChange={(event) => setTurmobKey(event.target.value)}
                    placeholder="Ayarlar’da kayıtlıysa boş bırakılabilir"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleTurmobFill}
                  disabled={turmobBusy}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                >
                  {turmobBusy ? "Sorgulanıyor..." : "TÜRMOB’dan Doldur"}
                </button>
              </div>
              {turmobMessage ? <p className="mt-2 text-xs font-semibold text-emerald-600">{turmobMessage}</p> : null}
              {turmobError ? <p className="mt-2 text-xs font-semibold text-rose-600">{turmobError}</p> : null}
            </div>
          </div>
        </section>

        <section className="rounded-[16px] border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="mb-5 border-b border-[var(--line)] pb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">İletişim ve Finans</p>
            <h3 className="mt-1 text-[1.35rem] font-extrabold text-slate-900">Detaylı alanlar</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">Ülke telefon alan kodu</span>
              <input value={form.phoneCountryCode} onChange={(event) => setForm((current) => ({ ...current, phoneCountryCode: event.target.value }))} placeholder="+90" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">Telefon</span>
              <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="2125551010" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">Mail adresi</span>
              <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="info@ornek.com" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">Web adresi</span>
              <input value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} placeholder="https://ornek.com" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">Yetkili isim soyisim</span>
              <input value={form.authorizedName} onChange={(event) => setForm((current) => ({ ...current, authorizedName: event.target.value }))} placeholder="Ayşe Yılmaz" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">Yetkili e-posta</span>
              <input type="email" value={form.authorizedEmail} onChange={(event) => setForm((current) => ({ ...current, authorizedEmail: event.target.value }))} placeholder="ayse@ornek.com" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">Fax</span>
              <input value={form.fax} onChange={(event) => setForm((current) => ({ ...current, fax: event.target.value }))} placeholder="2125551011" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">Kategori</span>
              <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Bayi" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">Döviz cinsi</span>
              <select value={form.currencyCode} onChange={(event) => setForm((current) => ({ ...current, currencyCode: event.target.value }))}>
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">Bakiye</span>
              <input type="number" step="0.01" value={form.openingBalance} onChange={(event) => setForm((current) => ({ ...current, openingBalance: event.target.value }))} />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">Açılış bakiyesi tarihi</span>
              <input type="date" value={form.openingBalanceDate} onChange={(event) => setForm((current) => ({ ...current, openingBalanceDate: event.target.value }))} />
            </label>
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-3 rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
          {message ? <p className="text-sm font-semibold text-emerald-600">{message}</p> : null}
          <p className="text-xs text-slate-500">Kurumsal kayıtta ünvan, bireysel kayıtta ad ve soyad zorunludur. Pozitif bakiye borç, negatif bakiye alacak olarak işlenir.</p>
        </div>
        <button disabled={busy} className="rounded-[12px] bg-[var(--brand)] px-5 py-3 text-sm font-extrabold text-white hover:bg-[var(--brand-strong)] disabled:opacity-60">
          {busy ? "Kaydediliyor..." : "Müşteri Kartını Oluştur"}
        </button>
      </div>
    </form>
  );
}

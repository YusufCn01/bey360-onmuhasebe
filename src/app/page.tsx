import Link from "next/link";
import { DealerApplicationForm } from "@/components/forms/dealer-application-form";

const featureCards = [
  {
    title: "Satış, alış ve e-Belge",
    text: "Satış faturası, alış faturası, e-Arşiv ve e-Fatura akışlarını tek panelde yönetin.",
  },
  {
    title: "Bayi ve tenant kurgusu",
    text: "Her bayi kendi müşterisini, ekibini, şubesini ve lisans akışını ayrı veri alanında çalıştırır.",
  },
  {
    title: "Finans merkezi",
    text: "Borç, alacak, tahsilat, ödeme, kasa, banka ve çek süreçlerini canlı izleyin.",
  },
  {
    title: "Entegrasyon altyapısı",
    text: "Hızlı Bilişim, banka, e-Ticaret, CRM ve mobil istemci hazırlığını aynı çekirdekte yönetin.",
  },
];

const modules = [
  "E-Fatura ve e-Arşiv",
  "Alış / satış faturaları",
  "Borç ve alacak takibi",
  "Teklif ve sipariş yönetimi",
  "Siparişten otomatik fatura",
  "Stok ve ürün takibi",
  "Tahsilat ve ödeme",
  "Kasa, banka ve çek",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--surface)] text-slate-800">
      <div className="border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand)] text-xl font-extrabold text-white">B</div>
            <div>
              <p className="font-display text-[2rem] font-extrabold leading-none tracking-tight text-slate-900">Bey360</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-slate-500">İş Yönetim Platformu</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/giris" className="inline-flex h-11 items-center rounded-[10px] bg-[var(--brand)] px-5 text-sm font-extrabold text-white hover:bg-[var(--brand-strong)]">
              Giriş Yap
            </Link>
            <Link href="/kurucu" className="inline-flex h-11 items-center rounded-[10px] border border-[var(--line)] bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Kurucu Paneli
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[18px] border border-[var(--line)] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <div className="grid gap-8 px-7 py-7 lg:grid-cols-[1fr_0.92fr] lg:items-center">
              <div>
                <span className="inline-flex rounded-full bg-[var(--brand-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--brand)]">Kurumsal ön muhasebe altyapısı</span>
                <h1 className="font-display mt-5 max-w-2xl text-5xl font-extrabold leading-tight tracking-tight text-slate-900">
                  Bayi sistemi, e-Fatura ve ticari operasyonları tek kurumsal panelde yönetin.
                </h1>
                <p className="mt-5 max-w-2xl text-[15px] leading-8 text-slate-600">
                  Bey360; Logo İşbaşı benzeri bir çalışma düzenini, çok kullanıcılı tenant altyapısını ve modern e-Belge süreçlerini tek ürün çatısında toplar. Kurucu ekip tenant açar, firmalar kendi operasyonunu bağımsız yönetir.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/giris" className="inline-flex h-11 items-center rounded-[10px] bg-[var(--brand)] px-5 text-sm font-extrabold text-white hover:bg-[var(--brand-strong)]">
                    Demo panele geç
                  </Link>
                  <Link href="/panel" className="inline-flex h-11 items-center rounded-[10px] border border-[var(--line)] bg-[var(--panel-soft)] px-5 text-sm font-semibold text-slate-700 hover:bg-white">
                    Genel bakışı incele
                  </Link>
                </div>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {modules.map((item) => (
                    <div key={item} className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm font-semibold text-slate-700">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[560px]">
                <div className="rounded-[18px] border border-[#d8dde6] bg-[#f7f8fb] p-3 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
                  <div className="overflow-hidden rounded-[14px] border border-[#d4dae4] bg-white">
                    <div className="flex items-center justify-between bg-[var(--brand)] px-4 py-3 text-white">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/80">Bey360</p>
                        <p className="font-display text-xl font-extrabold">Satış Faturaları</p>
                      </div>
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">Canlı Operasyon</span>
                    </div>
                    <div className="grid gap-3 bg-[#f4f6fa] p-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[10px] bg-white p-3 shadow-sm">
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Toplam Satış</p>
                          <p className="mt-2 text-lg font-extrabold text-slate-900">₺126.892</p>
                        </div>
                        <div className="rounded-[10px] bg-white p-3 shadow-sm">
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Tahsilat</p>
                          <p className="mt-2 text-lg font-extrabold text-slate-900">₺84.210</p>
                        </div>
                        <div className="rounded-[10px] bg-white p-3 shadow-sm">
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Açık Sipariş</p>
                          <p className="mt-2 text-lg font-extrabold text-slate-900">18</p>
                        </div>
                      </div>
                      <div className="rounded-[10px] bg-white p-3 shadow-sm">
                        <div className="grid grid-cols-[1.1fr_0.9fr_0.7fr_0.7fr] gap-3 border-b border-slate-100 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          <span>Cari</span>
                          <span>Belge No</span>
                          <span>Tutar</span>
                          <span>Durum</span>
                        </div>
                        <div className="space-y-2 pt-3 text-sm">
                          {[
                            ["Ayşe Emlak Ofisi", "SAT-2026-0142", "₺4.500", "Ödendi"],
                            ["Mehmet Lojistik", "SAT-2026-0143", "₺12.750", "Bekliyor"],
                            ["Seta Yazılım", "SAT-2026-0144", "₺2.200", "Gecikti"],
                          ].map((row) => (
                            <div key={row[1]} className="grid grid-cols-[1.1fr_0.9fr_0.7fr_0.7fr] gap-3 rounded-[8px] px-2 py-2 text-slate-700 even:bg-slate-50">
                              <span className="font-semibold text-slate-900">{row[0]}</span>
                              <span className="font-mono text-[13px]">{row[1]}</span>
                              <span className="font-bold">{row[2]}</span>
                              <span>{row[3]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-6 -left-8 hidden w-[200px] rounded-[16px] border border-[#d8dde6] bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)] lg:block">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Mobil POS</p>
                  <div className="mt-4 rounded-[18px] border border-slate-200 bg-[#f6f7fb] p-3">
                    <div className="rounded-[14px] bg-white p-3 shadow-sm">
                      <p className="font-display text-lg font-extrabold text-slate-900">Anlık Tahsilat</p>
                      <div className="mt-4 space-y-2">
                        <div className="h-2 rounded-full bg-slate-200" />
                        <div className="h-2 w-3/4 rounded-full bg-slate-200" />
                        <div className="h-16 rounded-[12px] bg-[var(--brand-soft)]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DealerApplicationForm />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((feature) => (
            <article key={feature.title} className="rounded-[14px] border border-[var(--line)] bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
              <p className="font-display text-[1.35rem] font-extrabold tracking-tight text-slate-900">{feature.title}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{feature.text}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

import Link from "next/link";
import { loginAction } from "@/app/giris/actions";

export default async function GirisPage({
  searchParams,
}: {
  searchParams?: Promise<{ hata?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams?.hata ? decodeURIComponent(resolvedSearchParams.hata) : "";

  return (
    <div className="min-h-screen bg-[var(--surface)] text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-8 border border-[var(--line)] bg-[var(--sidebar)] px-8 py-10">
          <div className="inline-flex items-center gap-2 border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            Bey360 Kurumsal
          </div>
          <h1 className="max-w-xl text-3xl font-black leading-tight text-white sm:text-4xl">
            Ön muhasebe, e-dönüşüm ve operasyon yönetimini daha sade bir panelden yönetin.
          </h1>
          <p className="max-w-lg text-sm leading-7 text-white/70">
            Bey360; satış, alış, stok, cari ve finans süreçlerini tek yapıda toplar. Giriş yaptıktan sonra tüm işlemleri
            aynı kurumsal akış içinde yönetebilirsiniz.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Finans</p>
              <p className="mt-3 font-semibold text-white">Tahsilat ve ödeme dengesi tek ekranda izlenir.</p>
            </div>
            <div className="border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">e-Dönüşüm</p>
              <p className="mt-3 font-semibold text-white">e-Fatura ve e-Arşiv süreçleri merkezi olarak yönetilir.</p>
            </div>
            <div className="border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Operasyon</p>
              <p className="mt-3 font-semibold text-white">Cari, stok ve belge akışları sade yapıda ilerler.</p>
            </div>
          </div>
        </div>

        <div className="border border-[var(--line)] bg-[var(--panel)] p-8 text-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Kullanıcı Girişi</p>
          <h2 className="mt-2 text-2xl font-extrabold">Panele erişin</h2>
          <p className="mt-1 text-sm text-slate-600">Yetkili kullanıcı bilgileriyle devam edin.</p>

          {error ? (
            <div className="mt-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          <form action={loginAction} className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">E-posta</span>
              <input
                name="email"
                type="email"
                required
                placeholder="ornek@firma.com"
                className="h-11 w-full border border-[var(--line)] bg-[var(--panel)] px-4 text-sm font-medium text-slate-900 outline-none focus:border-slate-400"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Şifre</span>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="h-11 w-full border border-[var(--line)] bg-[var(--panel)] px-4 text-sm font-medium text-slate-900 outline-none focus:border-slate-400"
              />
            </label>
            <button className="h-11 w-full border border-slate-900 bg-slate-900 text-sm font-extrabold text-white hover:bg-slate-800">
              Giriş yap
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
            <Link href="/sifremi-unuttum" className="font-semibold text-slate-700 hover:text-slate-900">
              Şifremi unuttum
            </Link>
            <Link href="/kayit" className="font-semibold text-slate-700 hover:text-slate-900">
              Yeni hesap oluştur
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

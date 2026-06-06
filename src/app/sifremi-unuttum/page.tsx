import Link from "next/link";
import { requestPasswordResetAction } from "@/app/sifremi-unuttum/actions";
import { getMailConfigurationState } from "@/lib/mail-config";
import { getLatestPasswordResetToken } from "@/lib/password-reset";

type ForgotPasswordPageProps = {
  searchParams?: Promise<{
    email?: string;
    mesaj?: string;
    hata?: string;
  }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = (await searchParams) ?? {};
  const email = params.email ? decodeURIComponent(params.email) : "";
  const message = params.mesaj ? decodeURIComponent(params.mesaj) : null;
  const error = params.hata ? decodeURIComponent(params.hata) : null;
  const tokenRecord = email ? await getLatestPasswordResetToken(email) : null;
  const previewLink = tokenRecord ? `/sifre-sifirla/${tokenRecord.token}` : null;
  const mailState = getMailConfigurationState();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(15,118,110,0.09),transparent_22%),linear-gradient(180deg,#f8fafc_0%,#eef3f6_44%,#e7edf1_100%)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-4xl items-center justify-center">
        <div className="w-full rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.98)_100%)] p-5 shadow-[0_28px_90px_rgba(15,23,42,0.08)] sm:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Şifre yenileme</p>
          <h1 className="mt-2 font-display text-[2rem] font-black tracking-tight text-slate-950 sm:text-[2.5rem]">Şifreni yenile</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            E-posta adresini yaz. Hesap kayıtlıysa sana yeni şifre belirleyebileceğin bağlantıyı gönderelim.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Mail gönderim modu</p>
              <p className="mt-2 text-lg font-extrabold text-slate-950">{mailState.mode}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{mailState.detail}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/90 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Kullanım notu</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Mail servisi henüz tanımlı değilse bağlantı test amaçlı aşağıda görünür. Canlı ortamda aynı akış e-posta üzerinden çalışır.
              </p>
            </div>
          </div>

          <form action={requestPasswordResetAction} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">E-posta</span>
              <input
                name="email"
                type="email"
                defaultValue={email}
                placeholder="ornek@firma.com"
                className="h-14 w-full rounded-[22px] border border-slate-200 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-[var(--brand)] focus:outline-none"
              />
            </label>

            {message ? (
              <p className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {message}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--brand)] px-5 text-sm font-black text-white shadow-[0_18px_30px_rgba(15,118,110,0.14)]"
              >
                Yenileme bağlantısı oluştur
              </button>
              <Link href="/giris" className="text-sm font-bold text-[var(--brand)]">
                Girişe dön
              </Link>
            </div>
          </form>

          {previewLink ? (
            <div className="mt-6 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Test bağlantısı</p>
              <p className="mt-2 break-all text-sm font-semibold text-slate-700">{previewLink}</p>
              <Link
                href={previewLink}
                className="mt-4 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700"
              >
                Şifre yenileme ekranını aç
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

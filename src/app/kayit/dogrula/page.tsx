import Link from "next/link";
import { resendVerificationAction } from "@/app/kayit/dogrula/actions";
import { getLatestEmailVerificationToken } from "@/lib/email-verification";
import { getMailConfigurationState } from "@/lib/mail-config";

type VerifyPageProps = {
  searchParams?: Promise<{
    email?: string;
    mesaj?: string;
    hata?: string;
  }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyPageProps) {
  const params = (await searchParams) ?? {};
  const email = params.email ? decodeURIComponent(params.email) : "";
  const message = params.mesaj ? decodeURIComponent(params.mesaj) : null;
  const error = params.hata ? decodeURIComponent(params.hata) : null;
  const tokenRecord = email ? await getLatestEmailVerificationToken(email) : null;
  const previewLink = tokenRecord ? `/kayit/dogrula/${tokenRecord.token}` : null;
  const mailState = getMailConfigurationState();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(15,118,110,0.09),transparent_22%),linear-gradient(180deg,#f8fafc_0%,#eef3f6_44%,#e7edf1_100%)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-4xl items-center justify-center">
        <div className="w-full rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.98)_100%)] p-5 shadow-[0_28px_90px_rgba(15,23,42,0.08)] sm:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">E-posta doğrulama</p>
          <h1 className="mt-2 font-display text-[2rem] font-black tracking-tight text-slate-950 sm:text-[2.5rem]">Hesabını doğrula</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Kayıt tamamlandı. Paneli kullanmadan önce e-posta adresini doğrulaman gerekiyor.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/90 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Doğrulanacak adres</p>
              <p className="mt-2 text-lg font-extrabold text-slate-950">{email || "Adres bulunamadı"}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Mail gönderim modu</p>
              <p className="mt-2 text-lg font-extrabold text-slate-950">{mailState.mode}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{mailState.detail}</p>
            </div>
          </div>

          {message ? <p className="mt-4 rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
              <p className="text-sm font-extrabold text-slate-950">Doğrulama bağlantısı</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Mail servisi aktifse bağlantı posta kutuna gider. Test modunda çalışıyorsan aşağıdaki bağlantıyı doğrudan kullanabilirsin.
              </p>

              {previewLink ? (
                <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Test bağlantısı</p>
                  <p className="mt-2 break-all text-sm font-semibold text-slate-700">{previewLink}</p>
                  <Link
                    href={previewLink}
                    className="mt-4 inline-flex rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-black text-white"
                  >
                    Doğrulamayı tamamla
                  </Link>
                </div>
              ) : (
                <p className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-700">
                  Aktif doğrulama bağlantısı bulunamadı. Aşağıdan yeni bağlantı oluşturabilirsin.
                </p>
              )}
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
              <p className="text-sm font-extrabold text-slate-950">Bağlantıyı yenile</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Doğrulama bağlantısı süresi dolduysa veya yeni bir bağlantı istiyorsan buradan tekrar oluştur.</p>
              <form action={resendVerificationAction} className="mt-4">
                <input type="hidden" name="email" value={email} />
                <button className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700">
                  Yeni bağlantı üret
                </button>
              </form>

              <div className="mt-6 border-t border-slate-200 pt-4">
                <Link href="/giris" className="text-sm font-bold text-[var(--brand)]">
                  Giriş ekranına dön
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

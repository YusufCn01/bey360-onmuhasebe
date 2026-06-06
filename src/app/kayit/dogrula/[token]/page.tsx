import Link from "next/link";
import { consumeEmailVerificationToken } from "@/lib/email-verification";

export default async function VerifyEmailTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await consumeEmailVerificationToken(token);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(15,118,110,0.09),transparent_22%),linear-gradient(180deg,#f8fafc_0%,#eef3f6_44%,#e7edf1_100%)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.98)_100%)] p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)] sm:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">E-posta doğrulama</p>
          <h1 className="mt-2 font-display text-[2rem] font-black tracking-tight text-slate-950 sm:text-[2.4rem]">
            {result.success ? "Doğrulama tamamlandı" : "Bağlantı geçersiz"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            {result.success
              ? "E-posta adresin doğrulandı. Şimdi firma kurulumunu tamamlayıp paneline geçebilirsin."
              : "Bu doğrulama bağlantısı kullanılmış veya süresi dolmuş olabilir. Yeni bağlantı üretip tekrar deneyebilirsin."}
          </p>

          <div className={`mt-6 rounded-[24px] border px-5 py-5 ${result.success ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
            <p className={`text-sm font-semibold ${result.success ? "text-emerald-700" : "text-rose-700"}`}>
              {result.success ? "Doğrulama başarılı." : "Doğrulama tamamlanamadı."}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {result.success ? (
              <Link href="/panel/onboarding" className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-black text-white">
                Kuruluma devam et
              </Link>
            ) : (
              <Link href="/kayit/dogrula" className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-black text-white">
                Yeni bağlantı oluştur
              </Link>
            )}
            <Link href="/giris" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700">
              Giriş ekranı
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

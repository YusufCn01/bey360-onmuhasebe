import Link from "next/link";
import { db } from "@/lib/db";
import { resetPasswordAction } from "@/app/sifre-sifirla/[token]/actions";

type ResetPasswordPageProps = {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ hata?: string }>;
};

export default async function ResetPasswordPage({ params, searchParams }: ResetPasswordPageProps) {
  const { token } = await params;
  const query = (await searchParams) ?? {};
  const error = query.hata ? decodeURIComponent(query.hata) : null;

  const record = await db.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  const isValid = Boolean(record && !record.usedAt && record.expiresAt > new Date());
  const userFullName = record?.user.fullName ?? "Kullanıcı";

  if (!isValid) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(15,118,110,0.09),transparent_22%),linear-gradient(180deg,#f8fafc_0%,#eef3f6_44%,#e7edf1_100%)] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-3xl items-center justify-center">
          <div className="w-full rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)] sm:p-8">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Şifre yenileme</p>
            <h1 className="mt-2 text-[2rem] font-black tracking-tight text-slate-950">Bağlantı geçerli değil</h1>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Bu bağlantı daha önce kullanılmış olabilir ya da süresi dolmuş olabilir. Yeni bir bağlantı oluşturup tekrar deneyebilirsin.
            </p>
            <Link href="/sifremi-unuttum" className="mt-6 inline-flex rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-black text-white">
              Yeni bağlantı oluştur
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(15,118,110,0.09),transparent_22%),linear-gradient(180deg,#f8fafc_0%,#eef3f6_44%,#e7edf1_100%)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)] sm:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Şifre yenileme</p>
          <h1 className="mt-2 text-[2rem] font-black tracking-tight text-slate-950">Yeni şifreni belirle</h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            {userFullName} hesabı için yeni şifre oluşturuyorsun. Güçlü ve kolay hatırlanabilir bir şifre seçmeni öneririz.
          </p>

          <form action={resetPasswordAction.bind(null, token)} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Yeni şifre</span>
              <input
                name="password"
                type="password"
                placeholder="En az 8 karakter"
                className="h-14 w-full rounded-[22px] border border-slate-200 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-[var(--brand)] focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Yeni şifre tekrar</span>
              <input
                name="passwordConfirm"
                type="password"
                placeholder="Şifreni tekrar yaz"
                className="h-14 w-full rounded-[22px] border border-slate-200 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-[var(--brand)] focus:outline-none"
              />
            </label>

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
                Şifreyi yenile
              </button>
              <Link href="/giris" className="text-sm font-bold text-[var(--brand)]">
                Girişe dön
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

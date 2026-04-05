import Link from "next/link";
import { loginAction } from "@/app/giris/actions";

const quickAccounts = {
  owner: { label: "Firma sahibi", email: "owner@demo.local", password: "Demo1234!" },
  accounting: { label: "Muhasebe", email: "muhasebe@demo.local", password: "Demo1234!" },
  founder: { label: "Kurucu", email: "kurucu@bey360.local", password: "Demo1234!" },
} as const;

type LoginPageProps = {
  searchParams?: Promise<{
    hesap?: keyof typeof quickAccounts;
    hata?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const selected = params.hesap ? quickAccounts[params.hesap] : quickAccounts.owner;
  const error = params.hata ? decodeURIComponent(params.hata) : null;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eff3f8_0%,#e6ebf2_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[0.94fr_1.06fr]">
          <section className="hidden rounded-[34px] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_35%),linear-gradient(160deg,#1d2738_0%,#162033_100%)] p-8 text-white shadow-[0_35px_100px_rgba(15,23,42,0.18)] lg:block">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-black text-[var(--brand)]">B</div>
              <div>
                <p className="font-display text-3xl font-black tracking-tight">Bey360</p>
                <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-300">Ön Muhasebe ve e-Dönüşüm</p>
              </div>
            </div>

            <div className="mt-10 space-y-4">
              <InfoCard title="Tek panel, net akış" text="Satış, alış, stok, e-Dönüşüm ve finans süreçleri aynı veri yapısında ilerler." />
              <InfoCard title="Rol bazlı yönetim" text="Kurucu, bayi, firma sahibi ve muhasebe ekipleri kendi yetkileriyle tek platformda çalışır." />
              <InfoCard title="Mobil odaklı kullanım" text="Panel artık mobil kullanım için daha sade, daha düzenli ve hızlı hareket edecek şekilde tasarlandı." />
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-[0_35px_100px_rgba(15,23,42,0.12)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3 lg:hidden">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand)] text-xl font-black text-white">B</div>
                  <div>
                    <p className="font-display text-2xl font-black tracking-tight text-slate-900">Bey360</p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Giriş Paneli</p>
                  </div>
                </div>
                <p className="mt-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 lg:mt-0">Kullanıcı Girişi</p>
                <h1 className="mt-2 text-[2rem] font-black tracking-tight text-slate-900 sm:text-[2.35rem]">Panelinize giriş yapın</h1>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
                  Firma paneli, muhasebe ekibi ve kurucu yönetimi için aynı giriş ekranı kullanılır. Mobilde de tek kart içinde net bir akış sunar.
                </p>
              </div>
              <Link href="/" className="hidden rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:inline-flex">
                Ana Sayfa
              </Link>
            </div>

            <form action={loginAction} className="mt-8 space-y-5">
              <div className="flex gap-3 overflow-x-auto pb-1">
                {Object.entries(quickAccounts).map(([key, account]) => (
                  <Link
                    key={key}
                    href={`/giris?hesap=${key}`}
                    className={`min-w-[148px] rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                      selected.email === account.email
                        ? "border-[var(--brand)] bg-rose-50 text-slate-900 shadow-[0_12px_26px_rgba(213,32,42,0.08)]"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-[var(--brand)] hover:bg-white"
                    }`}
                  >
                    <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Demo</span>
                    <span className="mt-1 block">{account.label}</span>
                  </Link>
                ))}
              </div>

              <div className="grid gap-4">
                <Field label="E-posta" name="email" placeholder="ornek@firma.com" defaultValue={selected.email} />
                <Field label="Şifre" name="password" placeholder="••••••••••" type="password" defaultValue={selected.password} />
              </div>

              {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="submit" className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-[var(--brand)] text-base font-black text-white transition hover:bg-[var(--brand-strong)]">
                  Giriş Yap
                </button>
                <Link href="/" className="inline-flex h-14 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:hidden">
                  Ana Sayfa
                </Link>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  defaultValue: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand)]"
      />
    </label>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
      <p className="text-sm font-black text-white">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate-200">{text}</p>
    </div>
  );
}

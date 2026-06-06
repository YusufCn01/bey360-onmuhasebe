import Link from "next/link";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { registerAction } from "@/app/kayit/actions";

type RegisterPageProps = {
  searchParams?: Promise<{
    hata?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = (await searchParams) ?? {};
  const error = params.hata ? decodeURIComponent(params.hata) : null;
  const plans = await db.packagePlan.findMany({
    where: { isActive: true },
    orderBy: [{ monthlyPrice: "asc" }, { name: "asc" }],
  });
  const defaultPlan = plans[0] ?? null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(15,118,110,0.1),transparent_22%),linear-gradient(180deg,#f8fafc_0%,#eef3f6_44%,#e7edf1_100%)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-6xl gap-5 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-[32px] border border-white/70 bg-[linear-gradient(160deg,#0f1720_0%,#132433_55%,#173247_100%)] p-5 text-white shadow-[0_32px_90px_rgba(15,23,42,0.18)] lg:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white text-2xl font-black text-[var(--brand)]">
                B
              </div>
              <div>
                <p className="font-display text-[2rem] font-black tracking-tight text-white">Bey360</p>
                <p className="mt-1 text-[11px] font-black uppercase tracking-[0.24em] text-white/55">14 gün deneme hesabı</p>
              </div>
            </div>

            <div className="mt-7">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-200/70">Hızlı başlangıç</p>
              <h1 className="mt-3 text-[2rem] font-black tracking-tight text-white sm:text-[2.4rem]">
                Firmanı birkaç adımda aç ve kullanmaya başla.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200">
                Hesabın, firma kartın ve ana şuben tek işlemde oluşur. Kayıt tamamlanınca doğrulama adımına geçer, ardından doğrudan paneline ulaşırsın.
              </p>
            </div>

            <div className="mt-6 grid gap-3">
              <Benefit title="Tek ekranda kurulum" text="Kullanıcı hesabı, firma kaydı ve ilk yetki yapısı otomatik hazırlanır." />
              <Benefit title="Deneme süresi hemen başlar" text="14 günlük deneme ile satış, finans, stok ve e-Dönüşüm akışlarını gerçek verinle deneyebilirsin." />
              <Benefit title="Planı şimdi seç, sonra değiştir" text="Kayıt sırasında aktif planlardan birini seçebilir, ihtiyaç değişirse abonelik ekranından talep açabilirsin." />
            </div>

            <div className="mt-6 rounded-[24px] border border-white/8 bg-white/6 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/55">Aktif planlar</p>
              <div className="mt-3 space-y-3">
                {plans.map((plan) => (
                  <div key={plan.id} className="rounded-[18px] border border-white/8 bg-white/7 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-extrabold text-white">{plan.name}</p>
                        <p className="mt-1 text-xs text-slate-200">
                          {plan.userLimit} kullanıcı · {plan.branchLimit} şube
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/55">Aylık</p>
                        <p className="text-sm font-black text-white">{formatCurrency(plan.monthlyPrice)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.98)_100%)] p-5 shadow-[0_28px_90px_rgba(15,23,42,0.08)] sm:p-7 xl:p-9">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Yeni hesap oluştur</p>
                <h2 className="mt-2 font-display text-[2rem] font-black tracking-tight text-slate-950 sm:text-[2.5rem]">Kayıt ol</h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
                  Aşağıdaki bilgileri doldur. Hesabın açıldığında firma kartın ve temel yapın senin için hazırlanmış olacak.
                </p>
              </div>
              <Link href="/giris" className="hidden rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:inline-flex">
                Giriş yap
              </Link>
            </div>

            <form action={registerAction} className="mt-8 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Firma adı" name="companyName" placeholder="Örn. Yıldız Ticaret" />
                <Field label="Ad soyad" name="fullName" placeholder="Örn. Ahmet Yılmaz" />
                <Field label="E-posta" name="email" type="email" placeholder="ornek@firma.com" />
                <Field label="Telefon" name="phone" placeholder="05xx xxx xx xx" />
                <Field label="Şehir" name="city" placeholder="İstanbul" />
                <label className="block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Paket</span>
                  <select
                    name="packagePlanId"
                    defaultValue={defaultPlan?.id ?? ""}
                    className="h-14 w-full rounded-[22px] border border-slate-200 bg-white px-4 text-base text-slate-900 focus:border-[var(--brand)] focus:outline-none"
                  >
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} · {formatCurrency(plan.monthlyPrice)} / ay
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <Field label="Şifre" name="password" type="password" placeholder="En az 8 karakter" />

              {error ? (
                <p className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {error}
                </p>
              ) : null}

              <div className="space-y-3">
                <button
                  type="submit"
                  className="flex h-14 w-full items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,var(--brand)_0%,#0f766e_100%)] text-base font-black text-white shadow-[0_22px_40px_rgba(15,118,110,0.18)] transition hover:brightness-105"
                >
                  Hesabımı oluştur
                </button>
                <div className="flex flex-col items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-500 sm:flex-row">
                  <span>Kayıt sonrası hesabın açılır ve e-posta doğrulama adımına yönlendirilirsin.</span>
                  <Link href="/giris" className="font-bold text-[var(--brand)] sm:hidden">
                    Giriş yap
                  </Link>
                </div>
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
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="h-14 w-full rounded-[22px] border border-slate-200 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-[var(--brand)] focus:outline-none"
      />
    </label>
  );
}

function Benefit({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-white/6 px-4 py-4">
      <p className="text-sm font-black text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-200">{text}</p>
    </div>
  );
}

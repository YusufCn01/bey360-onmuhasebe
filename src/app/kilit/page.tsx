import Link from "next/link";
import { redirect } from "next/navigation";
import { unlockAction } from "@/app/kilit/actions";
import { getCurrentUser, getSession, isSessionLocked } from "@/lib/auth";

type LockPageProps = {
  searchParams?: Promise<{
    hata?: string;
    returnTo?: string;
  }>;
};

export default async function LockPage({ searchParams }: LockPageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/giris");
  }

  if (!(await isSessionLocked())) {
    redirect(session.globalRole === "FOUNDER" ? "/kurucu" : "/panel");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/giris");
  }

  const params = (await searchParams) ?? {};
  const error = params.hata ? decodeURIComponent(params.hata) : null;
  const returnTo = params.returnTo?.startsWith("/") ? params.returnTo : "";
  const initials = user.fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef2f7_0%,#e4e9f0_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden rounded-[32px] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_35%),linear-gradient(160deg,#202b3c_0%,#152033_100%)] p-8 text-white shadow-[0_35px_100px_rgba(15,23,42,0.18)] lg:block">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-black text-[var(--brand)]">B</div>
              <div>
                <p className="font-display text-3xl font-black tracking-tight">Bey360</p>
                <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-300">Oturum Kilidi</p>
              </div>
            </div>

            <div className="mt-10 space-y-4">
              <InfoCard title="Hizli geri donus" text="Oturum kapanmaz; sadece panel gecici olarak kilitlenir ve sifre ile acilir." />
              <InfoCard title="Masa basindan kalkarken guvenli" text="Finans, e-Donusum ve cari ekranlari siz yokken korunur." />
              <InfoCard title="Mobil icin de hazir" text="Ayni kilit akisi mobil ekranda da temiz ve okunakli sekilde calisir." />
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-6 shadow-[0_35px_100px_rgba(15,23,42,0.12)] sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-18 w-18 items-center justify-center rounded-full bg-[var(--brand)] text-2xl font-black text-white shadow-[0_18px_40px_rgba(213,32,42,0.24)]">
                {initials}
              </div>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Kilit Ekrani</p>
              <h1 className="mt-2 text-[2rem] font-black tracking-tight text-slate-900">Tekrar devam edelim</h1>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                {user.fullName} hesabinin oturumu kilitlendi. Devam etmek icin sifrenizi girin.
              </p>
            </div>

            <form action={unlockAction} className="mt-8 space-y-5">
              <input type="hidden" name="returnTo" value={returnTo} />
              <label className="block">
                <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-slate-500">Sifre</span>
                <input
                  name="password"
                  type="password"
                  placeholder="Sifrenizi girin"
                  autoFocus
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand)]"
                />
              </label>

              {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

              <button type="submit" className="flex h-14 w-full items-center justify-center rounded-2xl bg-[var(--brand)] text-base font-black text-white transition hover:bg-[var(--brand-strong)]">
                Kilidi Ac
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/giris" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Farkli hesapla gir
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
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

import { AppShell } from "@/components/ui/app-shell";
import {
  MobileActionChips,
  MobileFilterBar,
  MobileHeroPanel,
  MobileStatStrip,
} from "@/components/ui/mobile-native-blocks";
import { QuickActionLink, SectionCard, StatusPill, SummaryCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatNumber } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

export default async function SuppliersListPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { membership, tenant, user } = await getTenantContext();
  const params = (await searchParams) ?? {};
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const suppliers = await db.supplier.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } });

  const filteredSuppliers = suppliers.filter((supplier) => {
    return !query || [supplier.name, supplier.code, supplier.phone ?? "", supplier.email ?? "", supplier.taxNumber ?? "", supplier.city ?? ""].some((value) => value.toLowerCase().includes(query));
  });

  const withPhone = filteredSuppliers.filter((supplier) => Boolean(supplier.phone)).length;
  const withEmail = filteredSuppliers.filter((supplier) => Boolean(supplier.email)).length;
  const withTaxNumber = filteredSuppliers.filter((supplier) => Boolean(supplier.taxNumber)).length;
  const readinessRate = filteredSuppliers.length > 0 ? Math.round((withTaxNumber / filteredSuppliers.length) * 100) : 0;

  return (
    <AppShell
      title="Tedarikçiler"
      subtitle="Tedarikçi portföyünü daha anlaşılır özetler ve sade liste yapısıyla yönetin."
      currentPath="/panel/cari/tedarikciler"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<QuickActionLink href="/panel/cari/tedarikci/yeni" label="Yeni Tedarikçi" />}
    >
      <div className="space-y-6">
        <MobileHeroPanel
          eyebrow="Tedarik Operasyonu"
          title="Tedarikçi havuzunu düzenli tutun"
          text="Eksik vergi ve iletişim bilgilerini mobilde hızla görün. Yeni kayıt, alış faturası ve gelen belge akışı tek ekranda yakın dursun."
        >
          <MobileStatStrip
            items={[
              { label: "Toplam", value: String(filteredSuppliers.length) },
              { label: "Telefon", value: String(withPhone), tone: "success" },
              { label: "E-posta", value: String(withEmail) },
              { label: "Vergi No", value: String(withTaxNumber), tone: "warn" },
            ]}
          />
          <div className="mt-4">
            <MobileActionChips
              actions={[
                { href: "/panel/cari/tedarikci/yeni", label: "Yeni Tedarikçi" },
                { href: "/panel/alis-faturalari/yeni", label: "Alış Faturası" },
                { href: "/panel/e-donusum/gelen-faturalar", label: "Gelen Belgeler" },
              ]}
            />
          </div>
        </MobileHeroPanel>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Toplam Tedarikçi" value={String(filteredSuppliers.length)} detail="Listede görünen kayıtlar" accent="border-l-4 border-l-amber-500 border-[var(--line)]" />
          <SummaryCard title="Telefonlu Kayıt" value={String(withPhone)} detail="İletişim numarası olanlar" accent="border-l-4 border-l-sky-500 border-[var(--line)]" />
          <SummaryCard title="E-posta Olanlar" value={String(withEmail)} detail="Mail bilgisi bulunanlar" accent="border-l-4 border-l-emerald-500 border-[var(--line)]" />
          <SummaryCard title="Vergi No Hazır" value={String(withTaxNumber)} detail="Vergi bilgisi tamam olanlar" accent="border-l-4 border-l-rose-500 border-[var(--line)]" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <SectionCard eyebrow="Tedarikçi Özeti" title="Portföy görünümü">
            <div className="space-y-3">
              <div className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Hazır oranı</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${readinessRate}%` }} />
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  Vergi bilgisi tamam olan tedarikçi oranı %{formatNumber(readinessRate)}
                </p>
              </div>
              <div className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Hızlı yorum</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {withTaxNumber >= Math.ceil(filteredSuppliers.length / 2)
                    ? "Tedarikçi verilerinin büyük bölümü işlem yapmaya hazır görünüyor."
                    : "Vergi ve iletişim bilgileri eksik olan tedarikçileri tamamlamak operasyonu hızlandırır."}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard eyebrow="Tedarikçi Listesi" title="Cari tedarikçi kartları">
            <div className="hidden lg:block">
              <form className="mb-5 grid gap-3 rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 lg:grid-cols-[1.2fr_auto]">
                <input name="q" defaultValue={query} placeholder="Firma, kod, telefon, e-posta, vergi no veya şehir ara" />
                <button className="rounded-[10px] bg-[var(--brand)] px-4 py-3 text-sm font-extrabold text-white hover:bg-[var(--brand-strong)]">
                  Filtrele
                </button>
              </form>
            </div>

            <MobileFilterBar>
              <form className="grid gap-2" action="/panel/cari/tedarikciler">
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Firma, vergi no veya şehir ara"
                  className="h-11 rounded-[14px] border border-[var(--line)] bg-white px-3 text-sm font-medium text-slate-700 outline-none"
                />
                <button className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[var(--brand)] px-4 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(213,32,42,0.18)]">
                  Filtrele
                </button>
              </form>
            </MobileFilterBar>

            <div className="space-y-3 lg:hidden">
              {filteredSuppliers.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-[var(--line)] bg-white px-4 py-10 text-center text-sm text-slate-500">
                  Aramanıza uygun tedarikçi kaydı bulunamadı.
                </div>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <article key={supplier.id} className="rounded-[20px] border border-[var(--line)] bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-extrabold text-slate-900">{supplier.name}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{supplier.code}</p>
                      </div>
                      <StatusPill label={supplier.taxNumber ? "Hazır" : "Eksik bilgi"} tone={supplier.taxNumber ? "emerald" : "amber"} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Telefon</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{supplier.phone ?? "Yok"}</p>
                      </div>
                      <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Şehir</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{supplier.city ?? "Yok"}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <p className="truncate">{supplier.email ?? "E-posta yok"}</p>
                      <p>{supplier.taxNumber ?? "Vergi no yok"}</p>
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="hidden overflow-hidden rounded-[18px] border border-[var(--line)] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.05)] lg:block">
              <div className="grid grid-cols-[minmax(240px,1.1fr)_minmax(220px,0.9fr)_minmax(180px,0.7fr)_auto] gap-4 border-b border-[var(--line)] bg-slate-50/80 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                <span>Tedarikçi</span>
                <span>İletişim</span>
                <span>Vergi / Şehir</span>
                <span className="text-right">Durum</span>
              </div>
              <div className="divide-y divide-[var(--line)]">
                {filteredSuppliers.length === 0 ? (
                  <div className="px-5 py-10 text-center text-sm text-slate-500">Aramanıza uygun tedarikçi kaydı bulunamadı.</div>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <div key={supplier.id} className="grid grid-cols-[minmax(240px,1.1fr)_minmax(220px,0.9fr)_minmax(180px,0.7fr)_auto] gap-4 px-5 py-4 transition hover:bg-slate-50/70">
                      <div>
                        <p className="font-extrabold text-slate-900">{supplier.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{supplier.code}</p>
                      </div>
                      <div className="space-y-1 text-sm text-slate-600">
                        <p>{supplier.phone ?? "Telefon yok"}</p>
                        <p className="truncate">{supplier.email ?? "E-posta yok"}</p>
                      </div>
                      <div className="space-y-1 text-sm text-slate-600">
                        <p>{supplier.taxNumber ?? "Vergi no yok"}</p>
                        <p>{supplier.city ?? "Şehir yok"}</p>
                      </div>
                      <div className="flex items-center justify-end">
                        <StatusPill label={supplier.taxNumber ? "Hazır" : "Eksik bilgi"} tone={supplier.taxNumber ? "emerald" : "amber"} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </SectionCard>
        </section>
      </div>
    </AppShell>
  );
}

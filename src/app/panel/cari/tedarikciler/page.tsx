import { AppShell } from "@/components/ui/app-shell";
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
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Toplam Tedarikçi" value={String(filteredSuppliers.length)} detail="Listede görünen kayıtlar" accent="border-l-4 border-l-amber-500 border-[var(--line)]" />
          <SummaryCard title="Telefonlu Kayıt" value={String(withPhone)} detail="İletişim numarası olanlar" accent="border-l-4 border-l-sky-500 border-[var(--line)]" />
          <SummaryCard title="E-posta Olanlar" value={String(withEmail)} detail="Mail bilgisi bulunanlar" accent="border-l-4 border-l-emerald-500 border-[var(--line)]" />
          <SummaryCard title="Vergi No Hazır" value={String(withTaxNumber)} detail="Vergi bilgisi tamam olanlar" accent="border-l-4 border-l-rose-500 border-[var(--line)]" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <SectionCard eyebrow="Tedarikçi Özeti" title="Portföy görünümü">
            <div className="space-y-3">
              <div className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Hazır oranı</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${filteredSuppliers.length > 0 ? (withTaxNumber / filteredSuppliers.length) * 100 : 0}%` }} />
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-700">Vergi bilgisi tamam olan tedarikçi oranı %{formatNumber(filteredSuppliers.length > 0 ? Math.round((withTaxNumber / filteredSuppliers.length) * 100) : 0)}</p>
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
            <form className="mb-5 grid gap-3 rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 lg:grid-cols-[1.2fr_auto]">
              <input name="q" defaultValue={query} placeholder="Firma, kod, telefon, e-posta, vergi no veya şehir ara" />
              <button className="rounded-[10px] bg-[var(--brand)] px-4 py-3 text-sm font-extrabold text-white hover:bg-[var(--brand-strong)]">Filtrele</button>
            </form>

            <div className="space-y-3">
              {filteredSuppliers.map((supplier) => (
                <div key={supplier.id} className="rounded-[16px] border border-[var(--line)] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-extrabold text-slate-900">{supplier.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{supplier.code} • {supplier.phone ?? "Telefon yok"}</p>
                      <p className="mt-2 text-xs text-slate-500">{supplier.email ?? "E-posta yok"}</p>
                      <p className="mt-1 text-xs text-slate-500">{supplier.taxNumber ?? "Vergi no yok"} • {supplier.city ?? "Şehir yok"}</p>
                    </div>
                    <StatusPill label="Tedarikçi" tone="amber" />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </section>
      </div>
    </AppShell>
  );
}

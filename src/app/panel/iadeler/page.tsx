import Link from "next/link";
import { AppShell } from "@/components/ui/app-shell";
import { QuickActionLink, SectionCard, SummaryCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

export default async function ReturnsPage() {
  const { membership, tenant, user } = await getTenantContext();
  const returns = await db.returnDocument.findMany({
    where: { tenantId: tenant.id },
    include: { customer: true, supplier: true, items: true },
    orderBy: { issueDate: "desc" },
  });

  const salesCount = returns.filter((item) => item.direction === "SALES").length;
  const purchaseCount = returns.filter((item) => item.direction === "PURCHASE").length;
  const totalAmount = returns.reduce((sum, item) => sum + Number(item.grandTotal), 0);

  return (
    <AppShell
      title="İadeler"
      subtitle="Satış ve satın alma iadelerini tek merkezden yönetin."
      currentPath="/panel/iadeler"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} · ${tenant.planName}`}
      topAction={<QuickActionLink href="/panel/iadeler/satis-yeni" label="Yeni Satış İadesi" />}
    >
      <div className="space-y-6">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Toplam iade" value={String(returns.length)} detail="Tüm kayıtlar" accent="border-l-4 border-l-sky-500 border-[var(--line)]" />
          <SummaryCard title="Satış iadesi" value={String(salesCount)} detail="Müşteri kaynaklı" accent="border-l-4 border-l-emerald-500 border-[var(--line)]" />
          <SummaryCard title="Satın alma iadesi" value={String(purchaseCount)} detail="Tedarikçiye dönüş" accent="border-l-4 border-l-amber-500 border-[var(--line)]" />
          <SummaryCard title="İade tutarı" value={formatCurrency(totalAmount)} detail="Toplam belge tutarı" accent="border-l-4 border-l-rose-500 border-[var(--line)]" />
        </section>

        <SectionCard
          eyebrow="İade Merkezi"
          title="İade listesi"
          action={
            <div className="flex gap-2">
              <Link href="/panel/iadeler/satis-yeni" className="rounded-[10px] border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Satış İadesi
              </Link>
              <Link href="/panel/iadeler/alis-yeni" className="rounded-[10px] border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Satın Alma İadesi
              </Link>
            </div>
          }
        >
          {returns.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-[var(--line)] bg-[var(--panel-soft)] px-4 py-8 text-sm text-slate-600">
              Henüz iade kaydı yok. Satış veya satın alma iadesi oluşturarak başlayabilirsiniz.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[16px] border border-[var(--line)]">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--line)] text-sm">
                  <thead className="bg-[var(--panel-soft)] text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Belge</th>
                      <th className="px-4 py-3">Tür</th>
                      <th className="px-4 py-3">Cari</th>
                      <th className="px-4 py-3">Neden</th>
                      <th className="px-4 py-3">Kalem</th>
                      <th className="px-4 py-3">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)] bg-white">
                    {returns.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-4">
                          <p className="font-mono text-sm font-bold text-slate-900">{item.returnNo}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatDate(item.issueDate)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${item.direction === "SALES" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {item.direction === "SALES" ? "Satış" : "Satın alma"}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-900">{item.customer?.name ?? item.supplier?.name ?? "-"}</td>
                        <td className="px-4 py-4 text-slate-600">{item.reason}</td>
                        <td className="px-4 py-4 text-slate-600">{item.items.length}</td>
                        <td className="px-4 py-4 font-extrabold text-slate-900">{formatCurrency(Number(item.grandTotal))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}

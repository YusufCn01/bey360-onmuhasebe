import { AppShell } from "@/components/ui/app-shell";
import { QuickActionLink, SectionCard, SummaryCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

export default async function ChequeNotesPage() {
  const { membership, tenant, user } = await getTenantContext();
  const notes = await db.chequeNote.findMany({
    where: { tenantId: tenant.id },
    include: { customer: true, supplier: true },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  const receivedTotal = notes.filter((item) => item.direction === "RECEIVED").reduce((sum, item) => sum + Number(item.amount), 0);
  const issuedTotal = notes.filter((item) => item.direction === "ISSUED").reduce((sum, item) => sum + Number(item.amount), 0);
  const portfolioCount = notes.filter((item) => item.status === "PORTFOLIO").length;
  const overdueCount = notes.filter((item) => item.dueDate && new Date(item.dueDate) < new Date() && item.status === "PORTFOLIO").length;

  return (
    <AppShell
      title="Çek / Senet"
      subtitle="Portföy, tahsilat ve ödeme tarafındaki çek / senet hareketlerini yönetin."
      currentPath="/panel/cek-senet"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<QuickActionLink href="/panel/cek-senet/yeni" label="Yeni Çek / Senet" />}
    >
      <div className="space-y-6">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Portföy adedi" value={String(notes.length)} detail="Tüm kayıtlar" accent="border-l-4 border-l-sky-500 border-[var(--line)]" />
          <SummaryCard title="Alınan toplam" value={formatCurrency(receivedTotal)} detail="Müşteri kaynaklı" accent="border-l-4 border-l-emerald-500 border-[var(--line)]" />
          <SummaryCard title="Verilen toplam" value={formatCurrency(issuedTotal)} detail="Tedarikçi kaynaklı" accent="border-l-4 border-l-amber-500 border-[var(--line)]" />
          <SummaryCard title="Vadesi geçen" value={String(overdueCount)} detail="Portföyde bekleyen gecikmeler" accent="border-l-4 border-l-rose-500 border-[var(--line)]" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <SectionCard eyebrow="Portföy Özeti" title="Genel durum">
            <div className="space-y-3">
              <div className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Portföyde bekleyen</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">{portfolioCount}</p>
                <p className="mt-1 text-xs text-slate-500">Tahsilat veya ödeme bekleyen çek/senet sayısı</p>
              </div>
              <div className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Nakit etkisi</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">Alınan ve verilen belgeler arasındaki fark {formatCurrency(receivedTotal - issuedTotal)} seviyesinde.</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard eyebrow="Portföy" title="Çek / senet listesi">
            {notes.length === 0 ? (
              <div className="rounded-[14px] border border-dashed border-[var(--line)] bg-[var(--panel-soft)] px-4 py-8 text-sm text-slate-600">
                Henüz çek / senet kaydı yok.
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
                        <th className="px-4 py-3">Vade</th>
                        <th className="px-4 py-3">Durum</th>
                        <th className="px-4 py-3">Tutar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)] bg-white">
                      {notes.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-4">
                            <p className="font-mono text-sm font-bold text-slate-900">{item.referenceNo}</p>
                            <p className="mt-1 text-xs text-slate-500">{formatDate(item.issueDate)}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-900">{item.type === "CHEQUE" ? "Çek" : "Senet"}</p>
                            <p className="mt-1 text-xs text-slate-500">{item.direction === "RECEIVED" ? "Alınan" : "Verilen"}</p>
                          </td>
                          <td className="px-4 py-4 font-semibold text-slate-900">{item.customer?.name ?? item.supplier?.name ?? "-"}</td>
                          <td className="px-4 py-4 text-slate-600">{item.dueDate ? formatDate(item.dueDate) : "-"}</td>
                          <td className="px-4 py-4 text-slate-600">{item.status}</td>
                          <td className="px-4 py-4 font-extrabold text-slate-900">{formatCurrency(Number(item.amount))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </SectionCard>
        </section>
      </div>
    </AppShell>
  );
}

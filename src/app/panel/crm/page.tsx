import Link from "next/link";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard, SummaryCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency, formatNumber } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

export default async function CrmPage() {
  const { membership, tenant, user } = await getTenantContext();

  const [leadCount, openLeadCount, taskCount, openTaskCount, leads] = await Promise.all([
    db.crmLead.count({ where: { tenantId: tenant.id } }),
    db.crmLead.count({ where: { tenantId: tenant.id, status: { notIn: ["WON", "LOST"] } } }),
    db.crmTask.count({ where: { tenantId: tenant.id } }),
    db.crmTask.count({ where: { tenantId: tenant.id, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    db.crmLead.findMany({
      where: { tenantId: tenant.id },
      include: { customer: true, ownerUser: true },
      orderBy: [{ updatedAt: "desc" }],
      take: 6,
    }),
  ]);

  const pipelineValue = leads
    .filter((lead) => !["WON", "LOST"].includes(lead.status))
    .reduce((sum, lead) => sum + Number(lead.expectedValue), 0);

  return (
    <AppShell
      title="CRM"
      subtitle={`${tenant.name} için fırsat, takip ve görev süreçlerini sade sayfa akışıyla yönetin.`}
      currentPath="/panel/crm"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={
        <Link
          href="/panel/crm/firsatlar/yeni"
          className="inline-flex h-10 items-center rounded-[10px] bg-[var(--brand)] px-4 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(213,32,42,0.18)] hover:bg-[var(--brand-strong)]"
        >
          Yeni Fırsat
        </Link>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Toplam fırsat" value={formatNumber(leadCount)} detail="CRM havuzundaki tüm kayıtlar" accent="border-l-4 border-l-sky-500 border-[var(--line)]" />
          <SummaryCard title="Açık fırsat" value={formatNumber(openLeadCount)} detail="Kapanmamış satış fırsatları" accent="border-l-4 border-l-amber-500 border-[var(--line)]" />
          <SummaryCard title="Toplam görev" value={formatNumber(taskCount)} detail="Ekibin tüm CRM görevleri" accent="border-l-4 border-l-rose-500 border-[var(--line)]" />
          <SummaryCard title="Pipeline değeri" value={formatCurrency(pipelineValue)} detail="Açık fırsatların toplam tutarı" accent="border-l-4 border-l-emerald-500 border-[var(--line)]" />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <SectionCard eyebrow="Fırsatlar" title="Fırsat yönetimi">
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/panel/crm/firsatlar" className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4 text-sm font-bold text-slate-700 hover:bg-white">
                Fırsat listesini aç
              </Link>
              <Link href="/panel/crm/firsatlar/yeni" className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4 text-sm font-bold text-slate-700 hover:bg-white">
                Yeni fırsat oluştur
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {leads.slice(0, 3).map((lead) => (
                <div key={lead.id} className="rounded-[12px] border border-[var(--line)] bg-white px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-extrabold text-slate-900">{lead.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {lead.customer?.name ?? "Genel fırsat"} · {lead.ownerUser?.fullName ?? "Atanmamış"}
                      </p>
                    </div>
                    <p className="text-sm font-black text-slate-900">{formatCurrency(Number(lead.expectedValue))}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard eyebrow="Görevler" title="Görev takibi">
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/panel/crm/gorevler" className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4 text-sm font-bold text-slate-700 hover:bg-white">
                Görev listesini aç
              </Link>
              <Link href="/panel/crm/gorevler/yeni" className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4 text-sm font-bold text-slate-700 hover:bg-white">
                Yeni görev oluştur
              </Link>
            </div>

            <div className="mt-5 rounded-[12px] border border-[var(--line)] bg-white px-4 py-4">
              <p className="text-sm text-slate-500">Açık görev sayısı</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">{formatNumber(openTaskCount)}</p>
              <p className="mt-2 text-sm text-slate-500">Görevler artık ayrı sayfalarda açılıyor; liste, oluşturma ve düzenleme iç içe değil.</p>
            </div>
          </SectionCard>
        </section>
      </div>
    </AppShell>
  );
}

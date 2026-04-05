import Link from "next/link";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard, StatusPill, SummaryCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

function leadTone(status: string) {
  if (status === "WON") return "emerald" as const;
  if (status === "LOST") return "rose" as const;
  if (status === "PROPOSAL" || status === "NEGOTIATION") return "amber" as const;
  if (status === "CONTACTED" || status === "QUALIFIED") return "blue" as const;
  return "slate" as const;
}

function leadLabel(status: string) {
  switch (status) {
    case "CONTACTED":
      return "İlk Temas";
    case "QUALIFIED":
      return "Nitelendi";
    case "PROPOSAL":
      return "Teklif";
    case "NEGOTIATION":
      return "Pazarlık";
    case "WON":
      return "Kazanıldı";
    case "LOST":
      return "Kaybedildi";
    default:
      return "Yeni";
  }
}

export default async function CrmLeadsPage() {
  const { membership, tenant, user } = await getTenantContext();
  const leads = await db.crmLead.findMany({
    where: { tenantId: tenant.id },
    include: {
      customer: true,
      ownerUser: true,
      notes: { orderBy: { createdAt: "desc" }, take: 1 },
      tasks: { where: { status: { in: ["OPEN", "IN_PROGRESS"] } } },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return (
    <AppShell
      title="Fırsatlar"
      subtitle="Fırsat kayıtlarını listeleyin, detayını açın ve ayrı sayfalarda düzenleyin."
      currentPath="/panel/crm/firsatlar"
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
          <SummaryCard title="Toplam fırsat" value={formatNumber(leads.length)} detail="CRM kayıtlarının tamamı" accent="border-l-4 border-l-sky-500 border-[var(--line)]" />
          <SummaryCard title="Teklif aşaması" value={formatNumber(leads.filter((lead) => lead.status === "PROPOSAL").length)} detail="Teklif bekleyen fırsatlar" accent="border-l-4 border-l-amber-500 border-[var(--line)]" />
          <SummaryCard title="Pazarlık aşaması" value={formatNumber(leads.filter((lead) => lead.status === "NEGOTIATION").length)} detail="Karar aşamasındaki fırsatlar" accent="border-l-4 border-l-rose-500 border-[var(--line)]" />
          <SummaryCard title="Kazanılan tutar" value={formatCurrency(leads.filter((lead) => lead.status === "WON").reduce((sum, lead) => sum + Number(lead.expectedValue), 0))} detail="Kazanıldı durumundaki fırsatlar" accent="border-l-4 border-l-emerald-500 border-[var(--line)]" />
        </section>

        <SectionCard eyebrow="Liste" title="Fırsat kayıtları">
          <div className="space-y-3">
            {leads.map((lead) => (
              <article key={lead.id} className="rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-extrabold text-slate-900">{lead.title}</p>
                      <StatusPill label={leadLabel(lead.status)} tone={leadTone(lead.status)} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {lead.customer?.name ?? "Genel fırsat"} · {lead.ownerUser?.fullName ?? "Atanmamış"}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{lead.summary ?? "Özet girilmemiş."}</p>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                      <span>Tutar: {formatCurrency(Number(lead.expectedValue))}</span>
                      <span>Olasılık: %{lead.probability}</span>
                      <span>Sonraki adım: {lead.nextActionAt ? formatDate(lead.nextActionAt) : "Planlanmadı"}</span>
                      <span>Açık görev: {formatNumber(lead.tasks.length)}</span>
                    </div>
                    {lead.notes[0] ? (
                      <p className="mt-3 rounded-[10px] border border-[var(--line)] bg-white px-3 py-3 text-sm text-slate-600">
                        Son not: {lead.notes[0].content}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href={`/panel/crm/firsatlar/${lead.id}`} className="rounded-[10px] border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                      Detay
                    </Link>
                    <Link href={`/panel/crm/firsatlar/${lead.id}/duzenle`} className="rounded-[10px] border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                      Düzenle
                    </Link>
                    <Link href={`/panel/crm/firsatlar/${lead.id}/not-ekle`} className="rounded-[10px] border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                      Not Ekle
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

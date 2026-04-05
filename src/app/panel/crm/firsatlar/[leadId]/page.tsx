import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard, StatusPill, StatRow } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
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

export default async function CrmLeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const { membership, tenant, user } = await getTenantContext();

  const lead = await db.crmLead.findFirst({
    where: { id: leadId, tenantId: tenant.id },
    include: {
      customer: true,
      ownerUser: true,
      notes: { include: { user: true }, orderBy: { createdAt: "desc" } },
      tasks: { include: { assignedUser: true }, orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }] },
    },
  });

  if (!lead) {
    notFound();
  }

  return (
    <AppShell
      title="Fırsat Detayı"
      subtitle="Tek fırsat kaydını, notlarını ve görevlerini ayrı sayfa düzeninde inceleyin."
      currentPath="/panel/crm/firsatlar"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={
        <div className="flex flex-wrap gap-2">
          <Link href={`/panel/crm/firsatlar/${lead.id}/duzenle`} className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">
            Düzenle
          </Link>
          <Link href={`/panel/crm/firsatlar/${lead.id}/not-ekle`} className="inline-flex h-10 items-center rounded-[10px] bg-[var(--brand)] px-4 text-sm font-extrabold text-white hover:bg-[var(--brand-strong)]">
            Not Ekle
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
          <SectionCard eyebrow="Kayıt Özeti" title={lead.title}>
            <div className="mb-4">
              <StatusPill label={leadLabel(lead.status)} tone={leadTone(lead.status)} />
            </div>
            <div className="space-y-3">
              <StatRow label="Müşteri" value={lead.customer?.name ?? "Genel fırsat"} />
              <StatRow label="Sorumlu" value={lead.ownerUser?.fullName ?? "Atanmamış"} />
              <StatRow label="Beklenen tutar" value={formatCurrency(Number(lead.expectedValue))} />
              <StatRow label="Olasılık" value={`%${lead.probability}`} />
              <StatRow label="Sonraki aksiyon" value={lead.nextActionAt ? formatDate(lead.nextActionAt) : "Planlanmadı"} />
              <StatRow label="Kaynak" value={lead.source ?? "Belirtilmedi"} />
            </div>
          </SectionCard>

          <SectionCard eyebrow="İçerik" title="Görüşme özeti">
            <p className="text-sm leading-7 text-slate-600">{lead.summary ?? "Bu fırsat için henüz özet girilmedi."}</p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Kontak kişi</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{lead.contactName ?? "Belirtilmedi"}</p>
              </div>
              <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Telefon</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{lead.contactPhone ?? "Belirtilmedi"}</p>
              </div>
              <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">E-posta</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{lead.contactEmail ?? "Belirtilmedi"}</p>
              </div>
            </div>
          </SectionCard>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <SectionCard eyebrow="Notlar" title="Fırsat notları">
            <div className="space-y-3">
              {lead.notes.length ? (
                lead.notes.map((note) => (
                  <div key={note.id} className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
                    <p className="text-sm leading-6 text-slate-700">{note.content}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-400">
                      {note.user?.fullName ?? "Sistem"} · {formatDate(note.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[12px] border border-dashed border-[var(--line)] px-4 py-6 text-sm text-slate-500">Bu fırsata henüz not eklenmemiş.</div>
              )}
            </div>
          </SectionCard>

          <SectionCard eyebrow="Görevler" title="Bağlı CRM görevleri">
            <div className="space-y-3">
              {lead.tasks.length ? (
                lead.tasks.map((task) => (
                  <div key={task.id} className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-extrabold text-slate-900">{task.title}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {task.assignedUser?.fullName ?? "Atanmamış"} · {task.dueAt ? formatDate(task.dueAt) : "Termin yok"}
                        </p>
                      </div>
                      <StatusPill
                        label={task.status === "DONE" ? "Tamamlandı" : task.status === "IN_PROGRESS" ? "Devam Ediyor" : task.status === "CANCELLED" ? "İptal" : "Açık"}
                        tone={task.status === "DONE" ? "emerald" : task.status === "IN_PROGRESS" ? "blue" : task.status === "CANCELLED" ? "rose" : "amber"}
                      />
                    </div>
                    {task.note ? <p className="mt-3 text-sm text-slate-600">{task.note}</p> : null}
                  </div>
                ))
              ) : (
                <div className="rounded-[12px] border border-dashed border-[var(--line)] px-4 py-6 text-sm text-slate-500">Bu fırsata bağlı görev bulunmuyor.</div>
              )}
            </div>
          </SectionCard>
        </section>
      </div>
    </AppShell>
  );
}

import Link from "next/link";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard, StatusPill, SummaryCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatDate, formatNumber } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

export default async function CrmTasksPage() {
  const { membership, tenant, user } = await getTenantContext();
  const tasks = await db.crmTask.findMany({
    where: { tenantId: tenant.id },
    include: {
      lead: true,
      assignedUser: true,
    },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
  });

  return (
    <AppShell
      title="Görevler"
      subtitle="CRM görevlerini ayrı liste, oluşturma ve düzenleme sayfalarında yönetin."
      currentPath="/panel/crm/gorevler"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={
        <Link
          href="/panel/crm/gorevler/yeni"
          className="inline-flex h-10 items-center rounded-[10px] bg-[var(--brand)] px-4 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(213,32,42,0.18)] hover:bg-[var(--brand-strong)]"
        >
          Yeni Görev
        </Link>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Açık görev" value={formatNumber(tasks.filter((task) => task.status === "OPEN").length)} detail="Henüz başlanmamış görevler" accent="border-l-4 border-l-amber-500 border-[var(--line)]" />
          <SummaryCard title="Devam eden" value={formatNumber(tasks.filter((task) => task.status === "IN_PROGRESS").length)} detail="Ekip tarafından işlenen görevler" accent="border-l-4 border-l-sky-500 border-[var(--line)]" />
          <SummaryCard title="Tamamlanan" value={formatNumber(tasks.filter((task) => task.status === "DONE").length)} detail="Kapanan kayıtlar" accent="border-l-4 border-l-emerald-500 border-[var(--line)]" />
          <SummaryCard title="İptal edilen" value={formatNumber(tasks.filter((task) => task.status === "CANCELLED").length)} detail="İptal durumuna alınan görevler" accent="border-l-4 border-l-rose-500 border-[var(--line)]" />
        </section>

        <SectionCard eyebrow="Liste" title="CRM görev kayıtları">
          <div className="space-y-3">
            {tasks.map((task) => (
              <article key={task.id} className="rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-extrabold text-slate-900">{task.title}</p>
                      <StatusPill
                        label={task.status === "DONE" ? "Tamamlandı" : task.status === "IN_PROGRESS" ? "Devam Ediyor" : task.status === "CANCELLED" ? "İptal" : "Açık"}
                        tone={task.status === "DONE" ? "emerald" : task.status === "IN_PROGRESS" ? "blue" : task.status === "CANCELLED" ? "rose" : "amber"}
                      />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {task.lead?.title ?? "Genel görev"} · {task.assignedUser?.fullName ?? "Atanmamış"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                      <span>Termin: {task.dueAt ? formatDate(task.dueAt) : "Belirtilmedi"}</span>
                      <span>Öncelik: {task.priority === "HIGH" ? "Yüksek" : task.priority === "LOW" ? "Düşük" : "Normal"}</span>
                    </div>
                    {task.note ? <p className="mt-3 text-sm text-slate-600">{task.note}</p> : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href={`/panel/crm/gorevler/${task.id}/duzenle`} className="rounded-[10px] border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                      Düzenle
                    </Link>
                    {task.leadId ? (
                      <Link href={`/panel/crm/firsatlar/${task.leadId}`} className="rounded-[10px] border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                        Fırsatı Aç
                      </Link>
                    ) : null}
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

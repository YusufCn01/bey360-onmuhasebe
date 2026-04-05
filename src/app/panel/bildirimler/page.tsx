import { AppShell } from "@/components/ui/app-shell";
import { QuickActionLink, SectionCard, SummaryCard } from "@/components/ui/module-blocks";
import { ReminderActionButtons } from "@/components/actions/reminder-action-buttons";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function RemindersPage() {
  const { membership, tenant, user } = await getTenantContext();
  const reminders = await db.reminder.findMany({
    where: { tenantId: tenant.id },
    orderBy: [{ isRead: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
  });

  const now = new Date();
  const openCount = reminders.filter((item) => item.status === "OPEN").length;
  const unreadCount = reminders.filter((item) => item.status === "OPEN" && !item.isRead).length;
  const overdueCount = reminders.filter((item) => item.status === "OPEN" && item.dueAt < now).length;

  return (
    <AppShell
      title="Bildirimler ve Hatirlatmalar"
      subtitle="Yaklasan isleri, geciken adimlari ve ekip icindeki aksiyonlari tek merkezden yonetin."
      currentPath="/panel/bildirimler"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} · ${tenant.planName}`}
      topAction={<QuickActionLink href="/panel/bildirimler/yeni" label="Yeni Hatirlatma" />}
    >
      <div className="space-y-6">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Toplam kayit" value={String(reminders.length)} detail="Tum hatirlatmalar" accent="border-l-4 border-l-sky-500 border-[var(--line)]" />
          <SummaryCard title="Okunmamis" value={String(unreadCount)} detail="Ust bardaki bildirim rozetine yansir" accent="border-l-4 border-l-rose-500 border-[var(--line)]" />
          <SummaryCard title="Acik kayit" value={String(openCount)} detail="Operasyon bekleyen gorevler" accent="border-l-4 border-l-emerald-500 border-[var(--line)]" />
          <SummaryCard title="Geciken" value={String(overdueCount)} detail="Tarihi gecmis oncelikler" accent="border-l-4 border-l-amber-500 border-[var(--line)]" />
        </section>

        <SectionCard eyebrow="Bildirim Merkezi" title="Hatirlatma listesi">
          {reminders.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-[var(--line)] bg-[var(--panel-soft)] px-4 py-8 text-sm text-slate-600">
              Henuz hatirlatma kaydi yok.
            </div>
          ) : (
            <div className="space-y-4">
              {reminders.map((item) => {
                const isOverdue = item.status === "OPEN" && item.dueAt < now;

                return (
                  <div
                    key={item.id}
                    className={`rounded-[18px] border p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] ${
                      item.isRead ? "border-[var(--line)] bg-white" : "border-rose-100 bg-rose-50/60"
                    }`}
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${item.isRead ? "bg-slate-300" : "bg-rose-500"}`} />
                          <p className={`text-lg tracking-tight ${item.isRead ? "font-bold text-slate-800" : "font-extrabold text-slate-900"}`}>{item.title}</p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                              item.status === "DONE"
                                ? "bg-emerald-100 text-emerald-700"
                                : item.status === "CANCELLED"
                                  ? "bg-slate-200 text-slate-600"
                                  : isOverdue
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-sky-100 text-sky-700"
                            }`}
                          >
                            {item.status === "DONE" ? "Tamamlandi" : item.status === "CANCELLED" ? "Iptal" : isOverdue ? "Gecikti" : "Acik"}
                          </span>
                          {!item.isRead ? (
                            <span className="rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">Yeni</span>
                          ) : null}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                          <span>
                            {formatDate(item.dueAt)} · {formatTime(item.dueAt)}
                          </span>
                          <span>Kanal: {item.channel}</span>
                          <span>Kayit: {[item.relatedType, item.relatedId].filter(Boolean).join(" · ") || "-"}</span>
                        </div>

                        {item.message ? <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{item.message}</p> : null}
                      </div>

                      <div className="xl:w-[320px]">
                        <ReminderActionButtons reminderId={item.id} isRead={item.isRead} status={item.status} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}

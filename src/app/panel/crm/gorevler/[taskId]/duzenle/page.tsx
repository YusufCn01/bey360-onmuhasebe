import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard } from "@/components/ui/module-blocks";
import { CrmTaskForm } from "@/components/forms/crm-task-form";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { tenantNavGroups } from "@/lib/navigation";

export default async function EditCrmTaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const { membership, tenant, user } = await getTenantContext();

  const [task, leads, members] = await Promise.all([
    db.crmTask.findFirst({ where: { id: taskId, tenantId: tenant.id } }),
    db.crmLead.findMany({ where: { tenantId: tenant.id }, select: { id: true, title: true }, orderBy: { updatedAt: "desc" } }),
    db.membership.findMany({ where: { tenantId: tenant.id }, include: { user: true }, orderBy: { createdAt: "asc" } }),
  ]);

  if (!task) {
    notFound();
  }

  return (
    <AppShell
      title="Görev Düzenle"
      subtitle="Görev kaydını ayrı düzenleme sayfasında güncelleyin."
      currentPath="/panel/crm/gorevler"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<Link href="/panel/crm/gorevler" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">Görev Listesi</Link>}
    >
      <SectionCard eyebrow="Güncelleme" title={task.title}>
        <CrmTaskForm
          endpoint={`/api/panel/crm/tasks/${task.id}`}
          method="PATCH"
          redirectTo="/panel/crm/gorevler"
          submitLabel="Değişiklikleri Kaydet"
          leads={leads}
          members={members.map((item) => ({ id: item.userId, fullName: item.user.fullName, role: item.role }))}
          initialValue={{
            title: task.title,
            leadId: task.leadId ?? "",
            assignedUserId: task.assignedUserId ?? "",
            dueAt: task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 10) : "",
            status: task.status,
            priority: task.priority,
            note: task.note ?? "",
          }}
        />
      </SectionCard>
    </AppShell>
  );
}

import Link from "next/link";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard } from "@/components/ui/module-blocks";
import { CrmTaskForm } from "@/components/forms/crm-task-form";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { tenantNavGroups } from "@/lib/navigation";

export default async function NewCrmTaskPage() {
  const { membership, tenant, user } = await getTenantContext();
  const [leads, members] = await Promise.all([
    db.crmLead.findMany({ where: { tenantId: tenant.id }, select: { id: true, title: true }, orderBy: { updatedAt: "desc" } }),
    db.membership.findMany({ where: { tenantId: tenant.id }, include: { user: true }, orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <AppShell
      title="Yeni Görev"
      subtitle="CRM görevini ayrı kayıt ekranında oluşturun."
      currentPath="/panel/crm/gorevler"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<Link href="/panel/crm/gorevler" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">Görev Listesi</Link>}
    >
      <SectionCard eyebrow="Kayıt" title="Görev bilgileri">
        <CrmTaskForm
          endpoint="/api/panel/crm/tasks"
          method="POST"
          redirectTo="/panel/crm/gorevler"
          submitLabel="Görevi Kaydet"
          leads={leads}
          members={members.map((item) => ({ id: item.userId, fullName: item.user.fullName, role: item.role }))}
        />
      </SectionCard>
    </AppShell>
  );
}

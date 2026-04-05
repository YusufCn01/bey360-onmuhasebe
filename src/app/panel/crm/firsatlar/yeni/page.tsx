import Link from "next/link";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard } from "@/components/ui/module-blocks";
import { CrmLeadForm } from "@/components/forms/crm-lead-form";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { tenantNavGroups } from "@/lib/navigation";

export default async function NewCrmLeadPage() {
  const { membership, tenant, user } = await getTenantContext();
  const [customers, members] = await Promise.all([
    db.customer.findMany({ where: { tenantId: tenant.id }, select: { id: true, code: true, name: true }, orderBy: { name: "asc" } }),
    db.membership.findMany({ where: { tenantId: tenant.id }, include: { user: true }, orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <AppShell
      title="Yeni Fırsat"
      subtitle="Yeni CRM fırsatını ayrı bir kayıt ekranında oluşturun."
      currentPath="/panel/crm/firsatlar"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<Link href="/panel/crm/firsatlar" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">Fırsat Listesi</Link>}
    >
      <SectionCard eyebrow="Kayıt" title="Fırsat bilgileri">
        <CrmLeadForm
          endpoint="/api/panel/crm/leads"
          method="POST"
          redirectTo="/panel/crm/firsatlar"
          submitLabel="Fırsatı Kaydet"
          customers={customers}
          members={members.map((item) => ({ id: item.userId, fullName: item.user.fullName, role: item.role }))}
        />
      </SectionCard>
    </AppShell>
  );
}

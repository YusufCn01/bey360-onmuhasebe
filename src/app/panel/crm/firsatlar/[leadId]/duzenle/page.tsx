import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard } from "@/components/ui/module-blocks";
import { CrmLeadForm } from "@/components/forms/crm-lead-form";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { tenantNavGroups } from "@/lib/navigation";

export default async function EditCrmLeadPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const { membership, tenant, user } = await getTenantContext();

  const [lead, customers, members] = await Promise.all([
    db.crmLead.findFirst({ where: { id: leadId, tenantId: tenant.id } }),
    db.customer.findMany({ where: { tenantId: tenant.id }, select: { id: true, code: true, name: true }, orderBy: { name: "asc" } }),
    db.membership.findMany({ where: { tenantId: tenant.id }, include: { user: true }, orderBy: { createdAt: "asc" } }),
  ]);

  if (!lead) {
    notFound();
  }

  return (
    <AppShell
      title="Fırsat Düzenle"
      subtitle="Fırsat kaydını ayrı bir düzenleme sayfasında güncelleyin."
      currentPath="/panel/crm/firsatlar"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<Link href={`/panel/crm/firsatlar/${lead.id}`} className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">Detay Sayfası</Link>}
    >
      <SectionCard eyebrow="Güncelleme" title={lead.title}>
        <CrmLeadForm
          endpoint={`/api/panel/crm/leads/${lead.id}`}
          method="PATCH"
          redirectTo={`/panel/crm/firsatlar/${lead.id}`}
          submitLabel="Değişiklikleri Kaydet"
          customers={customers}
          members={members.map((item) => ({ id: item.userId, fullName: item.user.fullName, role: item.role }))}
          initialValue={{
            title: lead.title,
            customerId: lead.customerId ?? "",
            ownerUserId: lead.ownerUserId ?? "",
            source: lead.source ?? "",
            contactName: lead.contactName ?? "",
            contactEmail: lead.contactEmail ?? "",
            contactPhone: lead.contactPhone ?? "",
            status: lead.status,
            expectedValue: String(Number(lead.expectedValue)),
            probability: String(lead.probability),
            nextActionAt: lead.nextActionAt ? new Date(lead.nextActionAt).toISOString().slice(0, 10) : "",
            summary: lead.summary ?? "",
          }}
        />
      </SectionCard>
    </AppShell>
  );
}

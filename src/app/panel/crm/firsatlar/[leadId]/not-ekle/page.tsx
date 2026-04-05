import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard } from "@/components/ui/module-blocks";
import { CrmNoteForm } from "@/components/forms/crm-note-form";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { tenantNavGroups } from "@/lib/navigation";

export default async function AddCrmLeadNotePage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const { membership, tenant, user } = await getTenantContext();

  const lead = await db.crmLead.findFirst({
    where: { id: leadId, tenantId: tenant.id },
    select: { id: true, title: true },
  });

  if (!lead) {
    notFound();
  }

  return (
    <AppShell
      title="Fırsata Not Ekle"
      subtitle="Yeni müşteri görüşmesi notunu ayrı kayıt ekranında ekleyin."
      currentPath="/panel/crm/firsatlar"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<Link href={`/panel/crm/firsatlar/${lead.id}`} className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">Fırsat Detayı</Link>}
    >
      <SectionCard eyebrow="Not" title={lead.title}>
        <CrmNoteForm leadId={lead.id} redirectTo={`/panel/crm/firsatlar/${lead.id}`} />
      </SectionCard>
    </AppShell>
  );
}

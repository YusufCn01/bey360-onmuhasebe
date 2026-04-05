import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentTemplateBuilder } from "@/components/forms/document-template-builder";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { ensureDocumentTemplates } from "@/lib/document-template-service";
import { templateKindMeta, type TemplateKind } from "@/lib/document-template-presets";
import { tenantNavGroups } from "@/lib/navigation";

const typeMap: Record<string, TemplateKind> = {
  fatura: "INVOICE",
  irsaliye: "DISPATCH",
  teklif: "QUOTE",
};

export default async function TemplateSettingsTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { membership, tenant, user } = await getTenantContext();
  const { type } = await params;
  const kind = typeMap[type];

  if (!kind) {
    notFound();
  }

  const templates = await ensureDocumentTemplates(tenant.id, kind);
  const meta = templateKindMeta[kind];

  return (
    <AppShell
      title={meta.title}
      subtitle={meta.subtitle}
      currentPath={`/panel/ayarlar/sablonlar/${type}`}
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<Link href="/panel/ayarlar/sablonlar" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">Şablon Merkezi</Link>}
    >
      <SectionCard eyebrow="Hazır Düzenler" title={meta.title}>
        <DocumentTemplateBuilder
          kind={kind}
          templates={templates}
          brandDefaults={{
            logoUrl: tenant.logoUrl,
            secondaryLogoUrl: tenant.secondaryLogoUrl,
            signatureImageUrl: tenant.signatureImageUrl,
            stampImageUrl: tenant.stampImageUrl,
            signatureName: tenant.signatureName,
            signatureTitle: tenant.signatureTitle,
          }}
        />
      </SectionCard>
    </AppShell>
  );
}

import Image from "next/image";
import { CompanySettingsForm } from "@/components/forms/company-settings-form";
import { AppShell } from "@/components/ui/app-shell";
import { QuickActionLink, SectionCard, StatRow, SummaryCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { tenantNavGroups } from "@/lib/navigation";

export default async function CompanySettingsPage() {
  const { membership, tenant, user } = await getTenantContext();

  return (
    <AppShell
      title="Firma Bilgileri"
      subtitle="Her ayar ayrı sayfada; firma kimliği, iletişim ve resmi bilgiler burada tutulur."
      currentPath="/panel/ayarlar/firma"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} · ${tenant.planName}`}
      topAction={<QuickActionLink href="/panel/ayarlar/subeler" label="Şube Ayarları" />}
    >
      <div className="space-y-6">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Firma kodu" value={tenant.code} detail="Sabit tenant kodu" accent="border-l-4 border-l-sky-500 border-[var(--line)]" />
          <SummaryCard title="Plan" value={tenant.planName} detail="Aktif lisans paketi" accent="border-l-4 border-l-amber-500 border-[var(--line)]" />
          <SummaryCard title="Şehir" value={tenant.city ?? "Tanımsız"} detail="Merkez lokasyon" accent="border-l-4 border-l-emerald-500 border-[var(--line)]" />
          <SummaryCard title="Durum" value={tenant.status} detail="Tenant çalışma durumu" accent="border-l-4 border-l-rose-500 border-[var(--line)]" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <SectionCard eyebrow="Kurumsal Kimlik" title="Firma özeti">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                {tenant.logoUrl ? <Image src={tenant.logoUrl} alt="Firma logosu" width={120} height={56} unoptimized className="h-14 w-auto rounded-[12px] border border-[var(--line)] bg-white p-2" /> : null}
                {tenant.secondaryLogoUrl ? <Image src={tenant.secondaryLogoUrl} alt="İkinci logo" width={120} height={56} unoptimized className="h-14 w-auto rounded-[12px] border border-[var(--line)] bg-white p-2" /> : null}
                {tenant.stampImageUrl ? <Image src={tenant.stampImageUrl} alt="Kaşe veya mühür" width={88} height={88} unoptimized className="h-20 w-20 rounded-[12px] border border-[var(--line)] bg-white p-2 object-contain" /> : null}
              </div>
              <StatRow label="Firma adı" value={tenant.name} />
              <StatRow label="Vergi numarası" value={tenant.taxNumber ?? "Tanımsız"} />
              <StatRow label="Telefon" value={tenant.phone ?? "Tanımsız"} />
              <StatRow label="E-posta" value={tenant.email ?? "Tanımsız"} />
              <StatRow label="İmza adı" value={tenant.signatureName ?? "Tanımsız"} />
              <StatRow label="İmza unvanı" value={tenant.signatureTitle ?? "Tanımsız"} />
              <StatRow label="Kaşe / mühür" value={tenant.stampImageUrl ? "Yüklü" : "Tanımsız"} />
            </div>
          </SectionCard>

          <SectionCard eyebrow="Kurumsal Kimlik" title="Firma kartını güncelle">
            <CompanySettingsForm initial={{ name: tenant.name, taxNumber: tenant.taxNumber ?? "", phone: tenant.phone ?? "", email: tenant.email ?? "", city: tenant.city ?? "", district: tenant.district ?? "", address: tenant.address ?? "", logoUrl: tenant.logoUrl ?? "", secondaryLogoUrl: tenant.secondaryLogoUrl ?? "", signatureImageUrl: tenant.signatureImageUrl ?? "", stampImageUrl: tenant.stampImageUrl ?? "", signatureName: tenant.signatureName ?? "", signatureTitle: tenant.signatureTitle ?? "" }} />
          </SectionCard>
        </section>
      </div>
    </AppShell>
  );
}

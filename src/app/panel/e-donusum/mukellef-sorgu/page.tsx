import { AppShell } from "@/components/ui/app-shell";
import { SectionCard } from "@/components/ui/module-blocks";
import { HizliBilisimMukellefLookup } from "@/components/forms/hizli-bilisim-mukellef-lookup";
import { getTenantContext } from "@/lib/access";
import { tenantNavGroups } from "@/lib/navigation";

export default async function MukellefSorguPage() {
  const { membership, tenant, user } = await getTenantContext();

  return (
    <AppShell
      title="Mükellef Sorgulama"
      subtitle="Müşterinin e-Fatura mı e-Arşiv mi olduğunu Hızlı Bilişim üzerinden kontrol edin."
      currentPath="/panel/e-donusum/mukellef-sorgu"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} · ${tenant.planName}`}
    >
      <div className="space-y-6">
        <SectionCard eyebrow="GİB Sorgusu" title="Mükellef durumu kontrolü">
          <HizliBilisimMukellefLookup />
        </SectionCard>
      </div>
    </AppShell>
  );
}

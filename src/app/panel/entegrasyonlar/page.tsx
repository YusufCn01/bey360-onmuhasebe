import Link from "next/link";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard, StatusPill } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { tenantNavGroups } from "@/lib/navigation";

const integrationCards = [
  {
    title: "Hızlı Bilişim e-Fatura",
    detail: "Sağlayıcı ayarları ve bağlantı testleri tek ekranda yönetilir.",
    status: "Hazır",
    tone: "emerald" as const,
    href: "/panel/ayarlar/hizli-bilisim",
  },
  {
    title: "e-Fatura Ayarları",
    detail: "Gönderici bilgileri, alias ve davranış ayarları bu sayfadan yönetilir.",
    status: "Hazır",
    tone: "blue" as const,
    href: "/panel/ayarlar/e-fatura",
  },
  {
    title: "CRM",
    detail: "Fırsat ve görev akışları ayrı CRM modülünden yönetilir.",
    status: "Aktif",
    tone: "amber" as const,
    href: "/panel/crm",
  },
];

export default async function IntegrationsPage() {
  const { membership, tenant, user } = await getTenantContext();

  return (
    <AppShell
      title="Entegrasyonlar"
      subtitle={`${tenant.name} için entegrasyon modülleri ayrı bağlantı sayfalarına ayrıldı.`}
      currentPath="/panel/entegrasyonlar"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
    >
      <SectionCard eyebrow="Bağlantılar" title="Entegrasyon modülleri">
        <div className="grid gap-4 xl:grid-cols-3">
          {integrationCards.map((item) => (
            <Link key={item.title} href={item.href} className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-[var(--brand)] hover:bg-slate-50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.detail}</p>
                </div>
                <StatusPill label={item.status} tone={item.tone} />
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}

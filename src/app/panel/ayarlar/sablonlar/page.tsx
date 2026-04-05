import Link from "next/link";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { tenantNavGroups } from "@/lib/navigation";

const cards = [
  {
    href: "/panel/ayarlar/sablonlar/fatura",
    title: "Fatura Şablonları",
    detail: "Satış ve alış faturaları için hazır örnekler ve sürükle-bırak düzenleyici.",
  },
  {
    href: "/panel/ayarlar/sablonlar/irsaliye",
    title: "İrsaliye Şablonları",
    detail: "Sevk ve teslim belgeleri için operasyon odaklı düzenler.",
  },
  {
    href: "/panel/ayarlar/sablonlar/teklif",
    title: "Teklif Şablonları",
    detail: "Teklif çıktılarında kurumsal görünüme uygun hazır şablonlar.",
  },
];

export default async function TemplateSettingsHubPage() {
  const { membership, tenant, user } = await getTenantContext();

  return (
    <AppShell
      title="Belge Şablonları"
      subtitle="Fatura, irsaliye ve teklif için hazır örnekleri açın; blokları sürükleyerek kendi düzeninizi oluşturun."
      currentPath="/panel/ayarlar/sablonlar"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
    >
      <SectionCard eyebrow="Şablon Merkezi" title="Belge türünü seçin">
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <Link key={card.href} href={card.href} className="rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] p-5 transition hover:bg-white">
              <h3 className="text-lg font-extrabold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{card.detail}</p>
            </Link>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}

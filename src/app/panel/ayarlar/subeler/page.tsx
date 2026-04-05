import { BranchForm } from "@/components/forms/branch-form";
import { AppShell } from "@/components/ui/app-shell";
import { QuickActionLink, SectionCard, StatusPill, SummaryCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { tenantNavGroups } from "@/lib/navigation";

export default async function BranchSettingsPage() {
  const { membership, tenant, user } = await getTenantContext();

  return (
    <AppShell
      title="Şube Ayarları"
      subtitle="Şube ve operasyon noktalarını ayrı ekranda yönetin."
      currentPath="/panel/ayarlar/subeler"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} · ${tenant.planName}`}
      topAction={<QuickActionLink href="/panel/ayarlar/firma" label="Firma Bilgileri" />}
    >
      <div className="space-y-6">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <SummaryCard title="Toplam şube" value={String(tenant.branches.length)} detail="Kayıtlı şube ve mağaza" accent="border-l-4 border-l-sky-500 border-[var(--line)]" />
          <SummaryCard title="Merkez" value={tenant.branches.find((item) => item.isMain)?.name ?? "Tanımsız"} detail="Ana operasyon noktası" accent="border-l-4 border-l-emerald-500 border-[var(--line)]" />
          <SummaryCard title="Yapı" value="Ayrı sayfa" detail="Şube ayarları diğer ayarlardan ayrıldı" accent="border-l-4 border-l-amber-500 border-[var(--line)]" />
        </section>

        <SectionCard eyebrow="Yeni Şube" title="Şube veya mağaza ekle">
          <BranchForm />
        </SectionCard>

        <SectionCard eyebrow="Şube Listesi" title="Tanımlı şubeler">
          <div className="grid gap-3 xl:grid-cols-2">
            {tenant.branches.map((branch) => (
              <div key={branch.id} className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-extrabold text-slate-900">{branch.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{branch.code} · {branch.city ?? "Şehir yok"}</p>
                    <p className="mt-2 text-xs text-slate-500">{branch.phone ?? "Telefon yok"}</p>
                  </div>
                  <StatusPill label={branch.isMain ? "Merkez" : "Şube"} tone={branch.isMain ? "emerald" : "slate"} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

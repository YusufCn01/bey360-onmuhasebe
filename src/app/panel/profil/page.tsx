import Image from "next/image";
import { ProfileSettingsForm } from "@/components/forms/profile-settings-form";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard, StatRow, SummaryCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { tenantNavGroups } from "@/lib/navigation";

function getMembershipLabel(role: string) {
  const map: Record<string, string> = {
    OWNER: "Yönetici",
    ADMIN: "Yönetici",
    ACCOUNTING: "Muhasebe",
    SALES: "Satış",
    OPERATION: "Operasyon",
    STAFF: "Personel",
    FOUNDER: "Kurucu",
  };

  return map[role] ?? role;
}

export default async function ProfilePage() {
  const { membership, tenant, user } = await getTenantContext();

  return (
    <AppShell
      title="Profilim"
      subtitle="Hesap bilgilerini, iletişim alanlarını ve oturum tercihlerini buradan yönetebilirsin."
      currentPath="/panel/profil"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${getMembershipLabel(membership.role)} · ${tenant.planName}`}
    >
      <div className="space-y-6">
        <section className="grid gap-5 md:grid-cols-3">
          <SummaryCard title="Rol" value={getMembershipLabel(membership.role)} detail="Aktif üyelik rolü" accent="border-l-4 border-l-sky-500 border-[var(--line)]" />
          <SummaryCard title="Tenant" value={tenant.name} detail="Çalıştığın şirket hesabı" accent="border-l-4 border-l-emerald-500 border-[var(--line)]" />
          <SummaryCard title="E-posta doğrulama" value={user.emailVerifiedAt ? "Doğrulandı" : "Bekliyor"} detail="Hesap güvenlik durumu" accent="border-l-4 border-l-amber-500 border-[var(--line)]" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <SectionCard eyebrow="Kullanıcı Özeti" title="Hesap kartı">
            <div className="space-y-3">
              {user.avatarUrl ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-[20px] border border-[var(--line)]">
                  <Image src={user.avatarUrl} alt="Profil görseli" fill unoptimized className="object-cover" />
                </div>
              ) : (
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-[20px] bg-slate-900 text-lg font-black text-white">
                  {user.fullName
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </div>
              )}
              <StatRow label="Ad soyad" value={user.fullName} />
              <StatRow label="E-posta" value={user.email} />
              <StatRow label="Telefon" value={user.phone ?? "Tanımlı değil"} />
              <StatRow label="Aktif plan" value={tenant.planName} />
            </div>
          </SectionCard>

          <SectionCard eyebrow="Profil Düzenleme" title="Bilgileri güncelle">
            <ProfileSettingsForm
              initial={{
                fullName: user.fullName,
                email: user.email,
                phone: user.phone ?? "",
                avatarUrl: user.avatarUrl ?? "",
              }}
            />
          </SectionCard>
        </section>
      </div>
    </AppShell>
  );
}

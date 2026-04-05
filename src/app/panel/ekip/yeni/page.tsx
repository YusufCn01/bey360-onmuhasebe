import Link from "next/link";
import { TeamMemberForm } from "@/components/forms/team-member-form";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard } from "@/components/ui/module-blocks";
import { canManageTenantUsers, getTenantContext } from "@/lib/access";
import { tenantNavGroups } from "@/lib/navigation";

export default async function NewTeamMemberPage() {
  const { membership, tenant, user } = await getTenantContext();

  return (
    <AppShell
      title="Yeni Ekip Üyesi"
      subtitle="Kullanıcı oluşturmayı ayrı sayfada yönetin."
      currentPath="/panel/ekip"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<Link href="/panel/ekip" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">Ekip Listesi</Link>}
    >
      {canManageTenantUsers(membership.role) ? (
        <SectionCard eyebrow="Kayıt" title="Kullanıcı bilgileri">
          <TeamMemberForm />
        </SectionCard>
      ) : (
        <SectionCard eyebrow="Yetki" title="Yönetici yetkisi gerekli">
          <p className="text-sm leading-7 text-slate-600">Bu sayfa yalnızca OWNER veya ADMIN rolündeki kullanıcılar tarafından kullanılabilir.</p>
        </SectionCard>
      )}
    </AppShell>
  );
}

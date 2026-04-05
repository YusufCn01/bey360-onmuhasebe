import Link from "next/link";
import { ReminderForm } from "@/components/forms/reminder-form";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { tenantNavGroups } from "@/lib/navigation";

export default async function NewReminderPage() {
  const { membership, tenant, user } = await getTenantContext();

  return (
    <AppShell
      title="Yeni Hatırlatma"
      subtitle="Operasyonel görevler ve yaklaşan tarihleri şimdiden planlayın."
      currentPath="/panel/bildirimler"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} · ${tenant.planName}`}
      topAction={<Link href="/panel/bildirimler" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">Hatırlatma Listesi</Link>}
    >
      <SectionCard eyebrow="Kayıt Ekranı" title="Yeni hatırlatma">
        <ReminderForm redirectPath="/panel/bildirimler" />
      </SectionCard>
    </AppShell>
  );
}

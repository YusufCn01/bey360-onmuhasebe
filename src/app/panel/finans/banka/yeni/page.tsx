import Link from "next/link";
import { BankAccountForm } from "@/components/forms/bank-account-form";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { tenantNavGroups } from "@/lib/navigation";

export default async function NewBankAccountPage() {
  const { membership, tenant, user } = await getTenantContext();

  return (
    <AppShell
      title="Yeni Banka Hesabı"
      subtitle="Banka hesabını ayrı kayıt sayfasında oluşturun."
      currentPath="/panel/finans"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<Link href="/panel/finans" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">Finans Ekranı</Link>}
    >
      <SectionCard eyebrow="Kayıt" title="Banka bilgileri">
        <BankAccountForm />
      </SectionCard>
    </AppShell>
  );
}

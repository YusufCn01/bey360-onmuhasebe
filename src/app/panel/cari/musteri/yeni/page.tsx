import Link from "next/link";
import { CustomerForm } from "@/components/forms/customer-form";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { tenantNavGroups } from "@/lib/navigation";

export default async function NewCustomerPage() {
  const { membership, tenant, user } = await getTenantContext();

  return (
    <AppShell
      title="Yeni Müşteri"
      subtitle="Müşteri kartını ayrı kayıt sayfasında oluşturun. Kurumsal ve bireysel tip aynı formda desteklenir."
      currentPath="/panel/cari"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<Link href="/panel/cari" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">Cari Listesi</Link>}
    >
      <SectionCard eyebrow="Kayıt" title="Müşteri bilgileri">
        <CustomerForm />
      </SectionCard>
    </AppShell>
  );
}

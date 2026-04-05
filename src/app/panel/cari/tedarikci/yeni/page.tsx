import Link from "next/link";
import { SupplierForm } from "@/components/forms/supplier-form";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { tenantNavGroups } from "@/lib/navigation";

export default async function NewSupplierPage() {
  const { membership, tenant, user } = await getTenantContext();

  return (
    <AppShell
      title="Yeni Tedarikçi"
      subtitle="Tedarikçi kartını ayrı kayıt sayfasında oluşturun."
      currentPath="/panel/cari"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<Link href="/panel/cari" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">Cari Listesi</Link>}
    >
      <SectionCard eyebrow="Kayıt" title="Tedarikçi bilgileri">
        <SupplierForm />
      </SectionCard>
    </AppShell>
  );
}

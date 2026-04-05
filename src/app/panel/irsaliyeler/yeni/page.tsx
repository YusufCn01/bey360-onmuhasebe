import Link from "next/link";
import { DispatchForm } from "@/components/forms/dispatch-form";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { tenantNavGroups } from "@/lib/navigation";

export default async function NewDispatchNotePage() {
  const { membership, tenant, user } = await getTenantContext();
  const [customers, products, dispatchCount] = await Promise.all([
    db.customer.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
    db.product.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
    db.dispatchNote.count({ where: { tenantId: tenant.id, direction: "SALES" } }),
  ]);

  const nextDispatchNo = `IRS-${String(dispatchCount + 1).padStart(5, "0")}`;

  return (
    <AppShell
      title="Satış İrsaliyeleri"
      subtitle="Yeni satış irsaliyesi"
      currentPath="/panel/irsaliyeler"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<Link href="/panel/irsaliyeler" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">İrsaliye Listesi</Link>}
    >
      <SectionCard eyebrow="Kayıt Ekranı" title="Satış irsaliyesi">
        <DispatchForm
          customers={customers.map((item) => ({
            id: item.id,
            code: item.code,
            name: item.name,
            taxNumber: item.taxNumber,
            phone: item.phone,
            email: item.email,
            city: item.city,
          }))}
          products={products.map((item) => ({
            id: item.id,
            code: item.code,
            name: item.name,
            barcode: item.barcode,
            salePrice: Number(item.salePrice),
            vatRate: Number(item.vatRate),
          }))}
          nextDispatchNo={nextDispatchNo}
          redirectPath="/panel/irsaliyeler"
        />
      </SectionCard>
    </AppShell>
  );
}

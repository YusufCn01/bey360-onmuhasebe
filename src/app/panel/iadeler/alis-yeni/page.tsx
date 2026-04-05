import Link from "next/link";
import { ReturnDirection } from "@prisma/client";
import { ReturnForm } from "@/components/forms/return-form";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { tenantNavGroups } from "@/lib/navigation";

export default async function NewPurchaseReturnPage() {
  const { membership, tenant, user } = await getTenantContext();
  const [customers, suppliers, products, returnCount] = await Promise.all([
    db.customer.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
    db.supplier.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
    db.product.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
    db.returnDocument.count({ where: { tenantId: tenant.id, direction: "PURCHASE" } }),
  ]);

  const nextReturnNo = `AIA-${String(returnCount + 1).padStart(5, "0")}`;

  return (
    <AppShell
      title="Satın Alma İadesi"
      subtitle="Tedarikçiye dönen iadeleri ayrı belge tipiyle takip edin."
      currentPath="/panel/iadeler"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} · ${tenant.planName}`}
      topAction={<Link href="/panel/iadeler" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">İade Listesi</Link>}
    >
      <SectionCard eyebrow="Kayıt Ekranı" title="Yeni satın alma iadesi">
        <ReturnForm
          direction={ReturnDirection.PURCHASE}
          customers={customers.map((item) => ({ id: item.id, code: item.code, name: item.name }))}
          suppliers={suppliers.map((item) => ({ id: item.id, code: item.code, name: item.name }))}
          products={products.map((item) => ({
            id: item.id,
            code: item.code,
            name: item.name,
            barcode: item.barcode,
            salePrice: Number(item.salePrice),
            purchasePrice: Number(item.purchasePrice),
            vatRate: Number(item.vatRate),
          }))}
          nextReturnNo={nextReturnNo}
          redirectPath="/panel/iadeler"
        />
      </SectionCard>
    </AppShell>
  );
}

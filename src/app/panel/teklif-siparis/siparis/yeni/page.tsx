import Link from "next/link";
import { OrderForm } from "@/components/forms/order-form";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { getNextDocumentNumber } from "@/lib/business/documents";
import { db } from "@/lib/db";
import { tenantNavGroups } from "@/lib/navigation";

export default async function NewOrderPage() {
  const { membership, tenant, user } = await getTenantContext();
  const [customers, products, nextOrderNo] = await Promise.all([
    db.customer.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
    db.product.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
    getNextDocumentNumber(tenant.id, "ORDER"),
  ]);

  return (
    <AppShell
      title="Yeni Sipariş"
      subtitle="Sipariş kaydını ayrı sayfada oluşturun."
      currentPath="/panel/teklif-siparis"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<Link href="/panel/teklif-siparis" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">Teklif ve Sipariş</Link>}
    >
      <SectionCard eyebrow="Kayıt" title="Sipariş bilgileri">
        <OrderForm
          customers={customers.map((item) => ({ id: item.id, code: item.code, name: item.name }))}
          products={products.map((item) => ({ id: item.id, code: item.code, name: item.name, salePrice: Number(item.salePrice), vatRate: Number(item.vatRate) }))}
          nextOrderNo={nextOrderNo}
        />
      </SectionCard>
    </AppShell>
  );
}

import Link from "next/link";
import { InvoiceForm } from "@/components/forms/invoice-form";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { tenantNavGroups } from "@/lib/navigation";

export default async function NewRetailSalesInvoicePage() {
  const { membership, tenant, user } = await getTenantContext();
  const [customers, suppliers, products, invoiceCount, eInvoiceSettings] = await Promise.all([
    db.customer.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
    db.supplier.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
    db.product.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
    db.invoice.count({ where: { tenantId: tenant.id, direction: "SALES" } }),
    db.eInvoiceSettings.findUnique({ where: { tenantId: tenant.id } }),
  ]);

  const nextInvoiceNo = `PRK-${String(invoiceCount + 1).padStart(5, "0")}`;

  return (
    <AppShell
      title="Satış Faturaları"
      subtitle="Perakende Satış Faturası (KDV Dahil)"
      currentPath="/panel/satis-faturalari"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<Link href="/panel/satis-faturalari" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">Satış Faturaları</Link>}
    >
      <SectionCard eyebrow="Kayıt Ekranı" title="Perakende satış faturası">
        <InvoiceForm
          customers={customers.map((item) => ({
            id: item.id,
            name: item.name,
            code: item.code,
            taxNumber: item.taxNumber,
            phone: item.phone,
            email: item.email,
            city: item.city,
            district: item.district,
            address: item.address,
            country: item.country,
            postalCode: item.postalCode,
            taxOffice: item.taxOffice,
          }))}
          suppliers={suppliers.map((item) => ({ id: item.id, name: item.name, code: item.code, phone: item.phone, email: item.email, city: item.city }))}
          products={products.map((item) => ({
            id: item.id,
            name: item.name,
            code: item.code,
            salePrice: Number(item.salePrice),
            purchasePrice: Number(item.purchasePrice),
            vatRate: Number(item.vatRate),
          }))}
          nextInvoiceNo={nextInvoiceNo}
          initialDirection="SALES"
          initialSalesKind="RETAIL"
          redirectPath="/panel/satis-faturalari"
          companyInfo={{
            name: tenant.name,
            taxNumber: tenant.taxNumber,
            address: tenant.address,
            city: tenant.city,
            district: tenant.district,
            email: tenant.email,
            phone: tenant.phone,
            gibAlias: eInvoiceSettings?.gibAlias,
          }}
        />
      </SectionCard>
    </AppShell>
  );
}

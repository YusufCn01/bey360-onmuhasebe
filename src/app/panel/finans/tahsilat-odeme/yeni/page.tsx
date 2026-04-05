import Link from "next/link";
import { PaymentForm } from "@/components/forms/payment-form";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { tenantNavGroups } from "@/lib/navigation";

export default async function NewPaymentPage() {
  const { membership, tenant, user } = await getTenantContext();
  const invoices = await db.invoice.findMany({
    where: { tenantId: tenant.id },
    orderBy: { issueDate: "desc" },
    select: { id: true, invoiceNo: true },
  });

  return (
    <AppShell
      title="Yeni Tahsilat / Ödeme"
      subtitle="Finans hareketini ayrı kayıt sayfasında oluşturun."
      currentPath="/panel/finans"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<Link href="/panel/finans" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">Finans Ekranı</Link>}
    >
      <SectionCard eyebrow="Kayıt" title="Hareket bilgileri">
        <PaymentForm invoices={invoices} />
      </SectionCard>
    </AppShell>
  );
}

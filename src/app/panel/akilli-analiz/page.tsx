import { AppShell } from "@/components/ui/app-shell";
import { SmartFinanceInsightContent } from "@/components/dashboard/smart-finance-insight-content";
import { QuickActionLink } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { buildSmartFinanceInsights } from "@/lib/smart-finance-insights";
import { tenantNavGroups } from "@/lib/navigation";

export default async function SmartFinanceInsightPage() {
  const { membership, tenant, user } = await getTenantContext();
  const now = new Date();
  const last30Start = new Date(now);
  last30Start.setDate(now.getDate() - 30);
  const prev30Start = new Date(now);
  prev30Start.setDate(now.getDate() - 60);

  const [invoices, openReminders] = await Promise.all([
    db.invoice.findMany({
      where: { tenantId: tenant.id },
      orderBy: { issueDate: "desc" },
      include: { customer: true, supplier: true },
    }),
    db.reminder.count({
      where: {
        tenantId: tenant.id,
        status: "OPEN",
        dueAt: { lt: now },
      },
    }),
  ]);

  const salesInvoices = invoices.filter((item) => item.direction === "SALES");
  const purchaseInvoices = invoices.filter((item) => item.direction === "PURCHASE");
  const receivableBalance = salesInvoices.reduce(
    (sum, item) => sum + Math.max(Number(item.grandTotal) - Number(item.paidTotal), 0),
    0,
  );
  const payableBalance = purchaseInvoices.reduce(
    (sum, item) => sum + Math.max(Number(item.grandTotal) - Number(item.paidTotal), 0),
    0,
  );
  const last30Sales = salesInvoices
    .filter((item) => item.issueDate >= last30Start)
    .reduce((sum, item) => sum + Number(item.grandTotal), 0);
  const prev30Sales = salesInvoices
    .filter((item) => item.issueDate >= prev30Start && item.issueDate < last30Start)
    .reduce((sum, item) => sum + Number(item.grandTotal), 0);
  const last30Purchases = purchaseInvoices
    .filter((item) => item.issueDate >= last30Start)
    .reduce((sum, item) => sum + Number(item.grandTotal), 0);

  const { insightCards, recommendations } = buildSmartFinanceInsights({
    last30Sales,
    prev30Sales,
    last30Purchases,
    receivableBalance,
    payableBalance,
    openReminders,
  });

  return (
    <AppShell
      title="Akıllı Finansal İçgörü"
      subtitle="Son hareketleri özetleyip finansal açıdan dikkat isteyen başlıkları sade önerilerle önüne getirir."
      currentPath="/panel/akilli-analiz"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} · ${tenant.planName}`}
      topAction={<QuickActionLink href="/panel/para" label="Tahsilat ve Ödeme" />}
    >
      <SmartFinanceInsightContent
        tenantName={tenant.name}
        last30Sales={last30Sales}
        last30Purchases={last30Purchases}
        receivableBalance={receivableBalance}
        payableBalance={payableBalance}
        prev30Sales={prev30Sales}
        openReminders={openReminders}
        insightCards={insightCards}
        recommendations={recommendations}
      />
    </AppShell>
  );
}

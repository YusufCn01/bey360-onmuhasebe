import Link from "next/link";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard, StatRow, StatusPill, SummaryCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

export default async function ReportsPage() {
  const { membership, tenant, user } = await getTenantContext();

  const [invoices, products, quotes, orders, payments] = await Promise.all([
    db.invoice.findMany({
      where: { tenantId: tenant.id },
      include: { items: { include: { product: true } }, customer: true, supplier: true },
      orderBy: { issueDate: "desc" },
    }),
    db.product.findMany({ where: { tenantId: tenant.id }, orderBy: { stockQty: "asc" }, take: 8 }),
    db.quote.findMany({ where: { tenantId: tenant.id }, include: { customer: true }, orderBy: { createdAt: "desc" } }),
    db.salesOrder.findMany({ where: { tenantId: tenant.id }, include: { customer: true }, orderBy: { createdAt: "desc" } }),
    db.payment.findMany({ where: { tenantId: tenant.id }, orderBy: { transactionAt: "desc" } }),
  ]);

  const salesInvoices = invoices.filter((invoice) => invoice.direction === "SALES");
  const purchaseInvoices = invoices.filter((invoice) => invoice.direction === "PURCHASE");
  const totalSales = salesInvoices.reduce((sum, invoice) => sum + Number(invoice.grandTotal), 0);
  const totalPurchases = purchaseInvoices.reduce((sum, invoice) => sum + Number(invoice.grandTotal), 0);
  const totalCollections = payments.filter((payment) => payment.direction === "IN").reduce((sum, payment) => sum + Number(payment.amount), 0);
  const totalPayments = payments.filter((payment) => payment.direction === "OUT").reduce((sum, payment) => sum + Number(payment.amount), 0);
  const receivable = salesInvoices.reduce((sum, invoice) => sum + Math.max(Number(invoice.grandTotal) - Number(invoice.paidTotal), 0), 0);
  const payable = purchaseInvoices.reduce((sum, invoice) => sum + Math.max(Number(invoice.grandTotal) - Number(invoice.paidTotal), 0), 0);
  const quoteVolume = quotes.reduce((sum, quote) => sum + Number(quote.grandTotal), 0);
  const orderVolume = orders.reduce((sum, order) => sum + Number(order.grandTotal), 0);

  const productStats = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const invoice of salesInvoices) {
    for (const item of invoice.items) {
      const key = item.productId ?? item.description;
      const current = productStats.get(key) ?? { name: item.product?.name ?? item.description, qty: 0, revenue: 0 };
      current.qty += Number(item.quantity);
      current.revenue += Number(item.lineTotal);
      productStats.set(key, current);
    }
  }

  const topProducts = [...productStats.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  const atRiskProducts = products.filter((product) => Number(product.stockQty) <= 10);
  const orderStatusRows = [
    { label: "Taslak sipariş", value: orders.filter((order) => order.status === "DRAFT").length },
    { label: "Onaylı sipariş", value: orders.filter((order) => order.status === "APPROVED").length },
    { label: "Faturalanmış sipariş", value: orders.filter((order) => order.status === "INVOICED").length },
    { label: "Açık teklif", value: quotes.filter((quote) => ["DRAFT", "SENT"].includes(quote.status)).length },
  ];

  const recentDocuments = [...invoices].sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime()).slice(0, 8);

  return (
    <AppShell
      title="Raporlar"
      subtitle={`${tenant.name} için satış, tahsilat, stok riski ve teklif dönüşüm görünümü`}
      currentPath="/panel/raporlar"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} · ${tenant.planName}`}
      topAction={
        <Link href="/panel/faturalar" className="inline-flex h-10 items-center rounded-[10px] bg-[var(--brand)] px-4 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(213,32,42,0.18)] hover:bg-[var(--brand-strong)]">
          Belgelere Git
        </Link>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Satış hacmi" value={formatCurrency(totalSales)} detail={`${formatNumber(salesInvoices.length)} satış faturası`} accent="border-l-4 border-l-sky-500 border-[var(--line)]" />
          <SummaryCard title="Tahsilat oranı" value={`${Math.round((totalCollections / Math.max(totalSales, 1)) * 100)}%`} detail={`${formatCurrency(totalCollections)} tahsilat`} accent="border-l-4 border-l-emerald-500 border-[var(--line)]" />
          <SummaryCard title="Alış hacmi" value={formatCurrency(totalPurchases)} detail={`${formatCurrency(totalPayments)} ödeme`} accent="border-l-4 border-l-amber-500 border-[var(--line)]" />
          <SummaryCard title="Açık risk" value={formatCurrency(receivable + payable)} detail={`${formatCurrency(receivable)} alacak · ${formatCurrency(payable)} borç`} accent="border-l-4 border-l-rose-500 border-[var(--line)]" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <SectionCard eyebrow="Ticari Özet" title="Teklif, sipariş ve nakit durumu">
            <div className="grid gap-4 md:grid-cols-2">
              <StatRow label="Toplam teklif hacmi" value={formatCurrency(quoteVolume)} />
              <StatRow label="Toplam sipariş hacmi" value={formatCurrency(orderVolume)} />
              <StatRow label="Tahsil edilecek bakiye" value={formatCurrency(receivable)} />
              <StatRow label="Ödenecek bakiye" value={formatCurrency(payable)} />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {orderStatusRows.map((row) => (
                <div key={row.label} className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3">
                  <p className="text-sm text-slate-500">{row.label}</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">{formatNumber(row.value)}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard eyebrow="Stok Riski" title="Takip edilmesi gereken ürünler">
            <div className="space-y-3">
              {atRiskProducts.length ? (
                atRiskProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3">
                    <div>
                      <p className="font-extrabold text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500">
                        {product.code} · {product.unit}
                      </p>
                    </div>
                    <StatusPill label={`${formatNumber(Number(product.stockQty))} stok`} tone={Number(product.stockQty) <= 3 ? "rose" : "amber"} />
                  </div>
                ))
              ) : (
                <p className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4 text-sm text-slate-600">Kritik stok eşiğinde ürün yok.</p>
              )}
            </div>
          </SectionCard>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <SectionCard eyebrow="Ürün Performansı" title="En çok ciro üreten kalemler">
            <div className="space-y-3">
              {topProducts.length ? (
                topProducts.map((product) => (
                  <div key={product.name} className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-extrabold text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-500">{formatNumber(product.qty)} adet / hizmet satışı</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(product.revenue)}</p>
                        <p className="text-xs text-slate-500">Toplam ciro</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4 text-sm text-slate-600">Henüz satış hareketi olmadığı için ürün performansı oluşmadı.</p>
              )}
            </div>
          </SectionCard>

          <SectionCard eyebrow="Son Belgeler" title="Son işlem hareketi">
            <div className="space-y-3">
              {recentDocuments.map((document) => (
                <div key={document.id} className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-extrabold text-slate-900">{document.invoiceNo}</p>
                      <p className="text-xs text-slate-500">
                        {document.customer?.name ?? document.supplier?.name ?? "Genel kayıt"} · {formatDate(document.issueDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{formatCurrency(Number(document.grandTotal))}</p>
                      <StatusPill label={document.direction === "SALES" ? "Satış" : "Alış"} tone={document.direction === "SALES" ? "emerald" : "amber"} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </section>
      </div>
    </AppShell>
  );
}

import Link from "next/link";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard, StatRow, StatusPill, SummaryCard } from "@/components/ui/module-blocks";
import { TrendBarChart } from "@/components/ui/dashboard-charts";
import { getTenantContext } from "@/lib/access";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";
import { getWebReportsSnapshot } from "@/lib/reporting/live-reports";

function buildPeriodHref(period: string) {
  return `/panel/raporlar?period=${period}`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { membership, tenant, user } = await getTenantContext();
  const params = (await searchParams) ?? {};
  const periodParam = typeof params.period === "string" && ["3m", "6m", "12m"].includes(params.period) ? (params.period as "3m" | "6m" | "12m") : "6m";
  const partyQuery = typeof params.party === "string" ? params.party.trim().toLowerCase() : "";
  const productQuery = typeof params.product === "string" ? params.product.trim().toLowerCase() : "";
  const statusQuery = typeof params.status === "string" ? params.status.trim().toUpperCase() : "";
  const exportParams = new URLSearchParams();
  exportParams.set("period", periodParam);
  if (partyQuery) exportParams.set("party", partyQuery);
  if (productQuery) exportParams.set("product", productQuery);
  if (statusQuery) exportParams.set("status", statusQuery);

  const {
    salesInvoices,
    purchaseInvoices,
    filteredProducts,
    totalSales,
    totalPurchases,
    totalCollections,
    totalPayments,
    receivable,
    payable,
    quoteVolume,
    orderVolume,
    chartData,
    topProducts,
    atRiskProducts,
    orderStatusRows,
    recentDocuments,
  } = await getWebReportsSnapshot(tenant.id, {
    period: periodParam,
    partyQuery,
    productQuery,
    statusQuery,
  });
  const periodLabel = periodParam === "3m" ? "Son 3 Ay" : periodParam === "12m" ? "Son 12 Ay" : "Son 6 Ay";

  return (
    <AppShell
      title="Raporlar"
      subtitle={`${tenant.name} için satış, tahsilat, stok riski ve teklif dönüşüm görünümü`}
      currentPath="/panel/raporlar"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} · ${tenant.planName}`}
      topAction={
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/panel/raporlar/yazdir?${exportParams.toString()}`} className="inline-flex h-10 items-center border border-[var(--line)] bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
            PDF / YazdÄ±r
          </Link>
          <Link href={`/api/panel/reports/export?${exportParams.toString()}`} className="inline-flex h-10 items-center border border-[var(--line)] bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
            Excel
          </Link>
          <Link href="/panel/faturalar" className="inline-flex h-10 items-center rounded-[10px] bg-[var(--brand)] px-4 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(213,32,42,0.18)] hover:bg-[var(--brand-strong)]">
            Belgelere Git
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        <SectionCard
          eyebrow="Filtre"
          title="Raporu daralt"
          action={<Link href="/panel/raporlar" className="text-sm font-bold text-[var(--brand)]">Temizle</Link>}
        >
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px_auto]">
            <input name="party" defaultValue={partyQuery} placeholder="Müşteri, tedarikçi veya vergi no" className="h-11 border border-[var(--line)] bg-white px-3 text-sm font-medium text-slate-700 outline-none" />
            <input name="product" defaultValue={productQuery} placeholder="Ürün, barkod, belge no veya açıklama" className="h-11 border border-[var(--line)] bg-white px-3 text-sm font-medium text-slate-700 outline-none" />
            <input name="status" defaultValue={statusQuery} placeholder="Durum: ISSUED, PAID, DRAFT..." className="h-11 border border-[var(--line)] bg-white px-3 text-sm font-medium text-slate-700 outline-none" />
            <input type="hidden" name="period" value={periodParam} />
            <button className="inline-flex h-11 items-center justify-center border border-[var(--brand)] bg-[var(--brand)] px-4 text-sm font-bold text-white hover:bg-[var(--brand-strong)]">
              Filtrele
            </button>
          </form>
        </SectionCard>

        <SectionCard
          eyebrow="Canlı Rapor Merkezi"
          title="Satış ve alış eğilimi"
          action={
            <div className="flex flex-wrap gap-2">
              {[
                { key: "3m", label: "3 Ay" },
                { key: "6m", label: "6 Ay" },
                { key: "12m", label: "12 Ay" },
              ].map((item) => (
                <Link
                  key={item.key}
                  href={buildPeriodHref(item.key)}
                  className={`border px-3 py-2 text-xs font-extrabold ${
                    periodParam === item.key
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-[var(--line)] bg-[var(--panel-soft)] text-slate-700"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          }
        >
          <div className="mb-4 grid gap-4 md:grid-cols-3">
            <StatRow label="Dönem" value={periodLabel} />
            <StatRow label="Satış hacmi" value={formatCurrency(totalSales)} />
            <StatRow label="Alış hacmi" value={formatCurrency(totalPurchases)} />
          </div>
          <TrendBarChart data={chartData} primaryLabel="Satış" secondaryLabel="Alış" primaryColor="#315c7c" secondaryColor="#0f172a" />
        </SectionCard>

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

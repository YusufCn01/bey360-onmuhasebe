import Link from "next/link";
import type { ReactNode } from "react";
import { SmartFinanceInsightModal } from "@/components/dashboard/smart-finance-insight-modal";
import { AppShell } from "@/components/ui/app-shell";
import { TrendBarChart } from "@/components/ui/dashboard-charts";
import { StatusPill } from "@/components/ui/module-blocks";
import { MobileActionChips, MobileHeroPanel, MobileStatStrip } from "@/components/ui/mobile-native-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";
import { buildSmartFinanceInsights } from "@/lib/smart-finance-insights";

function buildMonthlyTrend(
  invoices: Array<{ issueDate: Date; direction: "SALES" | "PURCHASE"; grandTotal: unknown }>,
  monthWindow: number,
) {
  const formatter = new Intl.DateTimeFormat("tr-TR", { month: "short" });
  const months = Array.from({ length: monthWindow }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (monthWindow - 1 - index), 1);
    date.setHours(0, 0, 0, 0);

    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: formatter.format(date),
      receipts: 0,
      payments: 0,
    };
  });

  const bucket = new Map(months.map((month) => [month.key, month]));
  for (const invoice of invoices) {
    const issueDate = new Date(invoice.issueDate);
    const key = `${issueDate.getFullYear()}-${issueDate.getMonth()}`;
    const target = bucket.get(key);
    if (!target) {
      continue;
    }

    const value = Number(invoice.grandTotal);
    if (invoice.direction === "SALES") {
      target.receipts += value;
    } else {
      target.payments += value;
    }
  }

  return months;
}

function getMembershipLabel(role: string) {
  const map: Record<string, string> = {
    OWNER: "Yönetici",
    ADMIN: "Yönetici",
    ACCOUNTING: "Muhasebe",
    SALES: "Satış",
    OPERATION: "Operasyon",
    STAFF: "Personel",
    FOUNDER: "Kurucu",
  };

  return map[role] ?? role;
}

function getInvoiceStatusLabel(status: string) {
  switch (status) {
    case "PAID":
      return { label: "Ödendi", tone: "emerald" as const };
    case "PARTIAL":
      return { label: "Kısmi", tone: "blue" as const };
    case "ISSUED":
      return { label: "Kesildi", tone: "amber" as const };
    case "CANCELLED":
      return { label: "İptal", tone: "rose" as const };
    default:
      return { label: "Taslak", tone: "slate" as const };
  }
}

function MetricCard({
  title,
  value,
  detail,
  accent,
}: {
  title: string;
  value: string;
  detail: string;
  accent?: string;
}) {
  return (
    <article className={`erp-card p-6 transition hover:shadow-md ${accent ?? ""}`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">{title}</p>
      </div>
      <p className="mt-3 text-[1.8rem] font-extrabold tracking-tight text-[var(--text)]">{value}</p>
      <p className="mt-4 border-t border-[var(--line)] pt-3 text-sm text-[var(--muted)]">{detail}</p>
    </article>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="erp-card p-5 lg:p-6">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div>
          <h2 className="text-[1.02rem] font-extrabold tracking-tight text-[var(--brand-navy)]">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--line)] py-3 text-sm last:border-b-0">
      <span className="text-slate-600">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}

function buildPeriodHref(period: string) {
  return `/panel?period=${period}`;
}

function AllocationChart({ items }: { items: Array<{ label: string; value: number; color: string }> }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const segments = items
    .map((item) => ({
      ...item,
      size: total > 0 ? (item.value / total) * 100 : 0,
    }))
    .filter((item) => item.size > 0);

  const gradient = segments
    .reduce(
      (acc, item) => {
        const start = acc.cursor;
        const end = start + item.size;
        acc.parts.push(`${item.color} ${start}% ${end}%`);
        return { cursor: end, parts: acc.parts };
      },
      { cursor: 0, parts: [] as string[] },
    )
    .parts.join(", ");

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
      <div className="mx-auto flex h-40 w-40 items-center justify-center border border-[var(--line)] bg-[var(--panel-soft)]">
        <div className="flex h-32 w-32 items-center justify-center rounded-full" style={{ background: gradient ? `conic-gradient(${gradient})` : "#dbe3ea" }}>
          <div className="flex h-20 w-20 items-center justify-center bg-[var(--panel)] text-center text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
            Açık
            <br />
            Hesaplar
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="h-3 w-3" style={{ backgroundColor: item.color }} />
              <span>{item.label}</span>
            </div>
            <span className="font-bold text-slate-900">{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function PanelPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { membership, tenant, user } = await getTenantContext();
  const params = (await searchParams) ?? {};
  const periodParam = typeof params.period === "string" ? params.period : "6m";
  const monthWindow = periodParam === "3m" ? 3 : periodParam === "12m" ? 12 : 6;

  const [invoices, openQuotes, openOrders, cashAccounts, bankAccounts, openReminders, customerCount, productCount] =
    await Promise.all([
      db.invoice.findMany({
        where: { tenantId: tenant.id },
        orderBy: { issueDate: "desc" },
        take: 120,
        include: { customer: true, supplier: true },
      }),
      db.quote.count({ where: { tenantId: tenant.id, status: { in: ["DRAFT", "SENT"] } } }),
      db.salesOrder.count({ where: { tenantId: tenant.id, status: { in: ["DRAFT", "APPROVED"] } } }),
      db.cashAccount.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
      db.bankAccount.findMany({ where: { tenantId: tenant.id }, orderBy: { bankName: "asc" } }),
      db.reminder.count({ where: { tenantId: tenant.id, status: "OPEN", dueAt: { lt: new Date() } } }),
      db.customer.count({ where: { tenantId: tenant.id } }),
      db.product.count({ where: { tenantId: tenant.id } }),
    ]);

  const salesInvoices = invoices.filter((item) => item.direction === "SALES");
  const purchaseInvoices = invoices.filter((item) => item.direction === "PURCHASE");
  const totalSales = salesInvoices.reduce((sum, item) => sum + Number(item.grandTotal), 0);
  const totalPurchases = purchaseInvoices.reduce((sum, item) => sum + Number(item.grandTotal), 0);
  const receivableBalance = salesInvoices.reduce((sum, item) => sum + Math.max(Number(item.grandTotal) - Number(item.paidTotal), 0), 0);
  const payableBalance = purchaseInvoices.reduce((sum, item) => sum + Math.max(Number(item.grandTotal) - Number(item.paidTotal), 0), 0);
  const cashTotal = cashAccounts.reduce((sum, item) => sum + Number(item.balance), 0);
  const bankTotal = bankAccounts.reduce((sum, item) => sum + Number(item.balance), 0);
  const netPosition = cashTotal + bankTotal + receivableBalance - payableBalance;

  const monthlyTrend = buildMonthlyTrend(invoices, monthWindow);
  const chartData = monthlyTrend.map((item) => ({
    label: item.label,
    primary: item.receipts,
    secondary: item.payments,
  }));

  const last30Start = new Date();
  last30Start.setDate(last30Start.getDate() - 30);
  const prev30Start = new Date();
  prev30Start.setDate(prev30Start.getDate() - 60);

  const last30Sales = salesInvoices.filter((item) => item.issueDate >= last30Start).reduce((sum, item) => sum + Number(item.grandTotal), 0);
  const prev30Sales = salesInvoices
    .filter((item) => item.issueDate >= prev30Start && item.issueDate < last30Start)
    .reduce((sum, item) => sum + Number(item.grandTotal), 0);
  const last30Purchases = purchaseInvoices.filter((item) => item.issueDate >= last30Start).reduce((sum, item) => sum + Number(item.grandTotal), 0);

  const salesDelta = prev30Sales > 0 ? ((last30Sales - prev30Sales) / prev30Sales) * 100 : 0;
  const purchaseDelta = prev30Sales > 0 ? ((last30Purchases - prev30Sales) / prev30Sales) * 100 : 0;

  const focusText =
    receivableBalance >= payableBalance
      ? "Tahsilat tarafı bugün daha kritik görünüyor. Açık müşteri bakiyeleri ve kapanacak satışlar öncelikli izlenmeli."
      : "Ödeme planı bugün daha baskın. Tedarikçi vadeleri ve alış faturaları birlikte takip edilmeli.";

  const { insightCards, recommendations } = buildSmartFinanceInsights({
    last30Sales,
    prev30Sales,
    last30Purchases,
    receivableBalance,
    payableBalance,
    openReminders,
  });

  const upcomingPayments = purchaseInvoices
    .filter((item) => Number(item.grandTotal) - Number(item.paidTotal) > 0)
    .sort((a, b) => {
      const aDate = a.dueDate ?? a.issueDate;
      const bDate = b.dueDate ?? b.issueDate;
      return aDate.getTime() - bDate.getTime();
    })
    .slice(0, 4);

  const topCustomerMap = new Map<string, { name: string; total: number; count: number }>();
  for (const invoice of salesInvoices) {
    const name = invoice.customer?.name ?? invoice.supplier?.name ?? "Genel kayıt";
    const current = topCustomerMap.get(name) ?? { name, total: 0, count: 0 };
    current.total += Number(invoice.grandTotal);
    current.count += 1;
    topCustomerMap.set(name, current);
  }

  const topCustomers = Array.from(topCustomerMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  const latestSales = salesInvoices.slice(0, 6);
  const urgentDueAmount = upcomingPayments[0] ? Math.max(Number(upcomingPayments[0].grandTotal) - Number(upcomingPayments[0].paidTotal), 0) : 0;

  const allocationItems = [
    { label: "Tahsilat bekleyen", value: receivableBalance, color: "#4c6f8b" },
    { label: "Ödeme bekleyen", value: payableBalance, color: "#111827" },
    { label: "Kasa bakiyesi", value: cashTotal, color: "#98a5b3" },
    { label: "Banka bakiyesi", value: bankTotal, color: "#d6dde4" },
  ];

  return (
    <AppShell
      title="Genel Bakış"
      subtitle="Finansal durum, operasyon yoğunluğu ve bekleyen işleri tek ekranda izleyin."
      currentPath="/panel"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${getMembershipLabel(membership.role)} · ${tenant.planName}`}
      userEmail={user.email}
      showWorkspaceCard={false}
      topAction={
        <div className="flex flex-wrap gap-2">
          <SmartFinanceInsightModal
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
          <Link href="/panel/satis-faturalari/yeni" className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--brand)] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--brand-strong)]">
            Yeni Fatura
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        <MobileHeroPanel eyebrow="Bugün" title="Finans özeti" text={focusText}>
          <MobileStatStrip
            items={[
              { label: "Satış", value: formatCurrency(totalSales) },
              { label: "Alış", value: formatCurrency(totalPurchases), tone: "warn" },
              { label: "Tahsilat", value: formatCurrency(receivableBalance), tone: "success" },
              { label: "Ödeme", value: formatCurrency(payableBalance), tone: "danger" },
            ]}
          />
          <div className="mt-4 space-y-3">
            <MobileActionChips
              actions={[
                { href: "/panel/satis-faturalari/yeni", label: "Yeni Fatura" },
                { href: "/panel/para", label: "Finans" },
                { href: "/panel/stok", label: "Stok" },
              ]}
            />
            <SmartFinanceInsightModal
              mobile
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
          </div>
        </MobileHeroPanel>

        <section className="hidden lg:grid lg:grid-cols-[1.55fr_0.95fr] lg:gap-4">
          <Panel title="Yönetim özeti" subtitle="Bugün öne çıkan finans ve operasyon görünümü">
            <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
              <div>
                <p className="max-w-3xl text-[1rem] leading-8 text-slate-700">{focusText}</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-5 py-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">Net pozisyon</p>
                    <p className="mt-2 text-2xl font-extrabold text-[var(--brand-navy)]">{formatCurrency(netPosition)}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-5 py-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">Kasa + banka</p>
                    <p className="mt-2 text-2xl font-extrabold text-[var(--text)]">{formatCurrency(cashTotal + bankTotal)}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-5 py-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">Geciken iş</p>
                    <p className="mt-2 text-2xl font-extrabold text-[var(--danger)]">{formatNumber(openReminders)}</p>
                  </div>
                </div>
              </div>

              <div className="border border-[var(--line)] bg-[var(--panel-soft)] px-5 py-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Hızlı görünüm</p>
                <div className="mt-3 space-y-1">
                  <SummaryRow label="Açık tahsilat" value={formatCurrency(receivableBalance)} />
                  <SummaryRow label="Açık ödeme" value={formatCurrency(payableBalance)} />
                  <SummaryRow label="Açık teklifler" value={formatNumber(openQuotes)} />
                  <SummaryRow label="Açık siparişler" value={formatNumber(openOrders)} />
                  <SummaryRow label="Müşteri / ürün" value={`${formatNumber(customerCount)} / ${formatNumber(productCount)}`} />
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Bugün izlenecekler" subtitle="Kısa aksiyon listesi">
            <div className="space-y-4">
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-5 py-4">
                <p className="text-sm font-extrabold text-[var(--brand-navy)]">Kritik ödeme</p>
                <p className="mt-2 text-xl font-extrabold text-[var(--text)]">{formatCurrency(urgentDueAmount)}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">Bu hafta içinde kapanması gereken ödeme tutarı.</p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-5 py-4">
                <p className="text-sm font-extrabold text-[var(--brand-navy)]">Satış eğilimi</p>
                <p className="mt-2 text-xl font-extrabold text-[var(--text)]">%{formatNumber(Number(Math.abs(salesDelta).toFixed(1)))}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">Önceki döneme göre {salesDelta >= 0 ? "artış" : "gerileme"} görünüyor.</p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-5 py-4">
                <p className="text-sm font-extrabold text-[var(--brand-navy)]">Alış baskısı</p>
                <p className="mt-2 text-xl font-extrabold text-[var(--text)]">%{formatNumber(Number(Math.abs(purchaseDelta).toFixed(1)))}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">Son 30 gün alış hacmi önceki döneme göre {purchaseDelta >= 0 ? "yukarıda" : "aşağıda"}.</p>
              </div>
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          <MetricCard title="Aylık satış hacmi" value={formatCurrency(last30Sales)} detail={`${formatNumber(salesInvoices.length)} satış belgesi işlendi`} accent="border-t-2 border-t-[#4c6f8b]" />
          <MetricCard title="Aylık alış hacmi" value={formatCurrency(last30Purchases)} detail={`${formatNumber(purchaseInvoices.length)} alış belgesi işlendi`} accent="border-t-2 border-t-slate-400" />
          <MetricCard title="Bekleyen tahsilat" value={formatCurrency(receivableBalance)} detail="Müşteri tarafında kapanmayı bekleyen açık bakiye" accent="border-t-2 border-t-emerald-600" />
          <MetricCard title="Bekleyen ödeme" value={formatCurrency(payableBalance)} detail="Tedarikçi tarafında vade takibi gereken açık bakiye" accent="border-t-2 border-t-slate-900" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.85fr_0.95fr]">
          <Panel
            title="Nakit akışı trendi"
            subtitle="Aylık tahsilat ve ödeme gerçekleşmeleri"
            action={
              <div className="inline-flex border border-[var(--line)] bg-[var(--panel-soft)] p-1">
                {[
                  { value: "3m", label: "3 Ay" },
                  { value: "6m", label: "6 Ay" },
                  { value: "12m", label: "12 Ay" },
                ].map((option) => {
                  const active = periodParam === option.value;
                  return (
                    <Link key={option.value} href={buildPeriodHref(option.value)} className={`px-3 py-1.5 text-xs font-bold ${active ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"}`}>
                      {option.label}
                    </Link>
                  );
                })}
              </div>
            }
          >
            <TrendBarChart data={chartData} primaryLabel="Tahsilat" secondaryLabel="Ödeme" primaryColor="#4c6f8b" secondaryColor="#111827" />
          </Panel>

          <Panel title="Cari durum özeti" subtitle="Açık hesapların bugünkü dağılımı">
            <AllocationChart items={allocationItems} />
          </Panel>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <Panel title="Yaklaşan ödemeler" action={<Link href="/panel/alislar" className="text-sm font-bold text-[var(--brand)]">Tümü</Link>}>
            <div className="space-y-4">
              {upcomingPayments.length === 0 ? (
                <p className="text-sm text-slate-500">Yaklaşan ödeme bulunmuyor.</p>
              ) : (
                upcomingPayments.map((invoice) => (
                  <div key={invoice.id} className="flex items-start justify-between gap-3 border-b border-[var(--line)] pb-3 last:border-b-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-slate-900">{invoice.supplier?.name ?? invoice.customer?.name ?? "Genel kayıt"}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(invoice.dueDate ?? invoice.issueDate)}</p>
                    </div>
                    <span className="text-sm font-black text-slate-900">{formatCurrency(Math.max(Number(invoice.grandTotal) - Number(invoice.paidTotal), 0))}</span>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title="En yüksek hacimli müşteriler" action={<Link href="/panel/cari/musteriler" className="text-sm font-bold text-[var(--brand)]">Rapor</Link>}>
            <div className="space-y-4">
              {topCustomers.length === 0 ? (
                <p className="text-sm text-slate-500">Henüz müşteri hareketi yok.</p>
              ) : (
                topCustomers.map((customer, index) => (
                  <div key={customer.name} className="flex items-start gap-3 border-b border-[var(--line)] pb-3 last:border-b-0 last:pb-0">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-strong)] text-xs font-black text-[var(--brand-navy)]">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-slate-900">{customer.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatNumber(customer.count)} işlem</p>
                    </div>
                    <span className="text-sm font-black text-slate-900">{formatCurrency(customer.total)}</span>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title="Sistem bekleyenleri">
            <div className="space-y-3">
              <SummaryRow label="Açık teklifler" value={formatNumber(openQuotes)} />
              <SummaryRow label="Açık siparişler" value={formatNumber(openOrders)} />
              <SummaryRow label="Kasa bakiyesi" value={formatCurrency(cashTotal)} />
              <SummaryRow label="Geciken hatırlatmalar" value={formatNumber(openReminders)} />
              <SummaryRow label="Müşteri / ürün" value={`${formatNumber(customerCount)} / ${formatNumber(productCount)}`} />
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel title="Son satışlar" subtitle="Yakın dönem satış belgeleri" action={<Link href="/panel/satislar" className="text-sm font-bold text-[var(--brand)]">Tümünü aç</Link>}>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  <tr>
                    <th className="px-3 py-3">Tarih</th>
                    <th className="px-3 py-3">Cari</th>
                    <th className="px-3 py-3">Belge No</th>
                    <th className="px-3 py-3">Tutar</th>
                    <th className="px-3 py-3">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {latestSales.map((invoice) => {
                    const status = getInvoiceStatusLabel(invoice.status);
                    return (
                      <tr key={invoice.id} className="hover:bg-[var(--surface-muted)] transition">
                        <td className="px-3 py-4 text-[var(--muted)]">{formatDate(invoice.issueDate)}</td>
                        <td className="px-3 py-4 font-semibold text-[var(--brand-navy)]">{invoice.customer?.name ?? invoice.supplier?.name ?? "Genel kayıt"}</td>
                        <td className="px-3 py-4 font-mono text-[var(--muted)]">{invoice.invoiceNo}</td>
                        <td className="px-3 py-4 font-extrabold text-[var(--text)]">{formatCurrency(Number(invoice.grandTotal))}</td>
                        <td className="px-3 py-4">
                          <StatusPill label={status.label} tone={status.tone} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 lg:hidden">
              {latestSales.map((invoice) => {
                const status = getInvoiceStatusLabel(invoice.status);
                return (
                  <div key={invoice.id} className="border border-[var(--line)] bg-[var(--panel)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900">{invoice.customer?.name ?? invoice.supplier?.name ?? "Genel kayıt"}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(invoice.issueDate)} · {invoice.invoiceNo}
                        </p>
                      </div>
                      <StatusPill label={status.label} tone={status.tone} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-slate-500">Tutar</span>
                      <span className="font-extrabold text-slate-900">{formatCurrency(Number(invoice.grandTotal))}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Akıllı öneriler" subtitle="Bugün için kısa aksiyon listesi">
            <div className="space-y-3">
              {recommendations.slice(0, 4).map((item) => (
                <Link key={item.title} href={item.href} className="block rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-5 py-4 transition hover:border-[var(--brand-strong)] hover:shadow-sm hover:bg-white">
                  <p className="text-sm font-extrabold text-[var(--brand-navy)]">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{item.detail}</p>
                </Link>
              ))}
            </div>
          </Panel>
        </section>
      </div>
    </AppShell>
  );
}

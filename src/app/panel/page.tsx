import Link from "next/link";
import { AppShell } from "@/components/ui/app-shell";
import { QuickActionLink, SectionCard, StatRow, StatusPill, SummaryCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

function buildMonthlyTrend(invoices: Array<{ issueDate: Date; direction: "SALES" | "PURCHASE"; grandTotal: unknown }>, monthWindow: number) {
  const formatter = new Intl.DateTimeFormat("tr-TR", { month: "short" });
  const months = Array.from({ length: monthWindow }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - ((monthWindow - 1) - index), 1);
    date.setHours(0, 0, 0, 0);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    return {
      key,
      label: formatter.format(date),
      sales: 0,
      purchases: 0,
    };
  });

  const bucket = new Map(months.map((month) => [month.key, month]));
  for (const invoice of invoices) {
    const date = new Date(invoice.issueDate);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const target = bucket.get(key);
    if (!target) {
      continue;
    }

    const value = Number(invoice.grandTotal);
    if (invoice.direction === "SALES") {
      target.sales += value;
    } else {
      target.purchases += value;
    }
  }

  return months;
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

  const [invoices, openQuotes, openOrders, cashAccounts, bankAccounts] = await Promise.all([
    db.invoice.findMany({
      where: { tenantId: tenant.id },
      orderBy: { issueDate: "desc" },
      take: 18,
      include: { customer: true, supplier: true },
    }),
    db.quote.count({ where: { tenantId: tenant.id, status: { in: ["DRAFT", "SENT"] } } }),
    db.salesOrder.count({ where: { tenantId: tenant.id, status: { in: ["DRAFT", "APPROVED"] } } }),
    db.cashAccount.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
    db.bankAccount.findMany({ where: { tenantId: tenant.id }, orderBy: { bankName: "asc" } }),
  ]);

  const salesInvoices = invoices.filter((item) => item.direction === "SALES");
  const purchaseInvoices = invoices.filter((item) => item.direction === "PURCHASE");
  const totalSales = salesInvoices.reduce((sum, item) => sum + Number(item.grandTotal), 0);
  const totalPurchases = purchaseInvoices.reduce((sum, item) => sum + Number(item.grandTotal), 0);
  const receivableBalance = salesInvoices.reduce((sum, item) => sum + Math.max(Number(item.grandTotal) - Number(item.paidTotal), 0), 0);
  const payableBalance = purchaseInvoices.reduce((sum, item) => sum + Math.max(Number(item.grandTotal) - Number(item.paidTotal), 0), 0);
  const cashTotal = cashAccounts.reduce((sum, item) => sum + Number(item.balance), 0);
  const bankTotal = bankAccounts.reduce((sum, item) => sum + Number(item.balance), 0);
  const monthlyTrend = buildMonthlyTrend(invoices, monthWindow);
  const trendMax = Math.max(...monthlyTrend.flatMap((item) => [item.sales, item.purchases]), 1);
  const liquidityTotal = cashTotal + bankTotal;
  const receivableRatio = totalSales > 0 ? Math.min((receivableBalance / totalSales) * 100, 100) : 0;
  const payableRatio = totalPurchases > 0 ? Math.min((payableBalance / totalPurchases) * 100, 100) : 0;

  return (
    <AppShell
      title="Genel Bakış"
      subtitle={`${tenant.name} için daha anlaşılır ve grafik destekli kontrol ekranı.`}
      currentPath="/panel"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<QuickActionLink href="/panel/faturalar/yeni" label="Yeni Fatura" />}
    >
      <div className="space-y-6">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Toplam satış" value={formatCurrency(totalSales)} detail={`${formatNumber(salesInvoices.length)} satış belgesi`} accent="border-l-4 border-l-sky-500 border-[var(--line)]" />
          <SummaryCard title="Toplam alış" value={formatCurrency(totalPurchases)} detail={`${formatNumber(purchaseInvoices.length)} alış belgesi`} accent="border-l-4 border-l-amber-500 border-[var(--line)]" />
          <SummaryCard title="Tahsil edilecek" value={formatCurrency(receivableBalance)} detail="Açık satış bakiyesi" accent="border-l-4 border-l-emerald-500 border-[var(--line)]" />
          <SummaryCard title="Ödenecek" value={formatCurrency(payableBalance)} detail="Açık alış bakiyesi" accent="border-l-4 border-l-rose-500 border-[var(--line)]" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <SectionCard
            eyebrow="Finans Görünümü"
            title={`${monthWindow} aylık satış / alış trendi`}
            action={
              <form className="flex items-center gap-2">
                <select name="period" defaultValue={periodParam} className="rounded-[10px] border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold text-slate-600">
                  <option value="3m">Son 3 ay</option>
                  <option value="6m">Son 6 ay</option>
                  <option value="12m">Son 12 ay</option>
                </select>
                <button className="rounded-[10px] border border-[var(--line)] bg-white px-3 py-2 text-sm font-bold text-slate-700">Uygula</button>
              </form>
            }
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Link href="/panel/satislar" className="rounded-[16px] border border-sky-100 bg-sky-50/70 px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(14,165,233,0.12)]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sky-500">Satış performansı</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">{formatCurrency(totalSales)}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatNumber(salesInvoices.length)} kayıt</p>
                </Link>
                <Link href="/panel/alislar" className="rounded-[16px] border border-amber-100 bg-amber-50/70 px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(245,158,11,0.12)]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-500">Satın alma yükü</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">{formatCurrency(totalPurchases)}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatNumber(purchaseInvoices.length)} kayıt</p>
                </Link>
              </div>

              <div className={`grid gap-2 ${monthWindow <= 3 ? "grid-cols-3" : monthWindow <= 6 ? "grid-cols-6" : "grid-cols-6 md:grid-cols-12"}`}>
                {monthlyTrend.map((month) => (
                  <Link href={month.sales >= month.purchases ? "/panel/satislar" : "/panel/alislar"} key={month.key} className="flex min-h-[172px] flex-col justify-end gap-2 rounded-[18px] border border-[var(--line)] bg-[var(--panel-soft)] px-2 py-3 transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
                    <div className="flex h-28 items-end justify-center gap-1">
                      <div
                        className="w-3 rounded-full bg-sky-500"
                        style={{ height: `${Math.max((month.sales / trendMax) * 100, month.sales > 0 ? 12 : 4)}%` }}
                        title={`Satış ${formatCurrency(month.sales)}`}
                      />
                      <div
                        className="w-3 rounded-full bg-amber-400"
                        style={{ height: `${Math.max((month.purchases / trendMax) * 100, month.purchases > 0 ? 12 : 4)}%` }}
                        title={`Alış ${formatCurrency(month.purchases)}`}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{month.label}</p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">{formatNumber(Math.round(month.sales + month.purchases))}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard eyebrow="Bekleyen İşler" title="Bugün takip edilmesi gerekenler">
            <div className="space-y-3">
              <StatRow label="Açık teklifler" value={formatNumber(openQuotes)} />
              <StatRow label="Açık siparişler" value={formatNumber(openOrders)} />
              <StatRow label="Kasalar" value={formatCurrency(cashTotal)} />
              <StatRow label="Bankalar" value={formatCurrency(bankTotal)} />
              <div className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  <span>Tahsilat oranı</span>
                  <span>%{formatNumber(Math.round(receivableRatio))}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${receivableRatio}%` }} />
                </div>
              </div>
              <div className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  <span>Ödeme baskısı</span>
                  <span>%{formatNumber(Math.round(payableRatio))}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-rose-500" style={{ width: `${payableRatio}%` }} />
                </div>
              </div>
            </div>
          </SectionCard>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <SectionCard eyebrow="Likidite" title="Kasa ve banka dağılımı">
            <div className="space-y-4">
              <Link href="/panel/para" className="block rounded-[18px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Toplam likidite</p>
                    <p className="mt-1 text-2xl font-extrabold text-slate-900">{formatCurrency(liquidityTotal)}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>Kasa {formatCurrency(cashTotal)}</p>
                    <p>Banka {formatCurrency(bankTotal)}</p>
                  </div>
                </div>
                <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full bg-emerald-500" style={{ width: `${liquidityTotal > 0 ? (cashTotal / liquidityTotal) * 100 : 0}%` }} />
                  <div className="h-full bg-sky-500" style={{ width: `${liquidityTotal > 0 ? (bankTotal / liquidityTotal) * 100 : 0}%` }} />
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Kasa</span>
                  <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-sky-500" />Banka</span>
                </div>
              </Link>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link href="/panel/teklifler" className="rounded-[14px] border border-[var(--line)] bg-white px-4 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50">Teklifler</Link>
                <Link href="/panel/siparisler" className="rounded-[14px] border border-[var(--line)] bg-white px-4 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50">Siparişler</Link>
                <Link href="/panel/cari/musteriler" className="rounded-[14px] border border-[var(--line)] bg-white px-4 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50">Müşteriler</Link>
                <Link href="/panel/para" className="rounded-[14px] border border-[var(--line)] bg-white px-4 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50">Para Hareketleri</Link>
              </div>
            </div>
          </SectionCard>

          <SectionCard eyebrow="Son Belgeler" title="Son ticari hareketler" action={<Link href="/panel/satislar" className="text-sm font-bold text-[var(--brand)]">Tüm belgeleri aç</Link>}>
            <div className="space-y-3 lg:hidden">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="rounded-[16px] border border-[var(--line)] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-900">{invoice.customer?.name ?? invoice.supplier?.name ?? "Genel kayıt"}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(invoice.issueDate)} · {invoice.invoiceNo}</p>
                    </div>
                    <StatusPill
                      label={
                        invoice.status === "PAID"
                          ? "Ödendi"
                          : invoice.status === "PARTIAL"
                            ? "Kısmi"
                            : invoice.status === "ISSUED"
                              ? "Kesildi"
                              : invoice.status === "CANCELLED"
                                ? "İptal"
                                : "Taslak"
                      }
                      tone={invoice.status === "PAID" ? "emerald" : invoice.status === "PARTIAL" ? "blue" : invoice.status === "ISSUED" ? "amber" : invoice.status === "CANCELLED" ? "rose" : "slate"}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-500">{invoice.direction === "SALES" ? "Satış" : "Alış"}</span>
                    <span className="font-extrabold text-slate-900">{formatCurrency(Number(invoice.grandTotal))}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[var(--panel-soft)] text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Tarih</th>
                    <th className="px-4 py-3">Cari</th>
                    <th className="px-4 py-3">Belge No</th>
                    <th className="px-4 py-3">Yön</th>
                    <th className="px-4 py-3">Tutar</th>
                    <th className="px-4 py-3">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-4 text-slate-600">{formatDate(invoice.issueDate)}</td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{invoice.customer?.name ?? invoice.supplier?.name ?? "Genel kayıt"}</td>
                      <td className="px-4 py-4 font-mono text-slate-700">{invoice.invoiceNo}</td>
                      <td className="px-4 py-4 text-slate-600">{invoice.direction === "SALES" ? "Satış" : "Alış"}</td>
                      <td className="px-4 py-4 font-extrabold text-slate-900">{formatCurrency(Number(invoice.grandTotal))}</td>
                      <td className="px-4 py-4">
                        <StatusPill
                          label={
                            invoice.status === "PAID"
                              ? "Ödendi"
                              : invoice.status === "PARTIAL"
                                ? "Kısmi"
                                : invoice.status === "ISSUED"
                                  ? "Kesildi"
                                  : invoice.status === "CANCELLED"
                                    ? "İptal"
                                    : "Taslak"
                          }
                          tone={invoice.status === "PAID" ? "emerald" : invoice.status === "PARTIAL" ? "blue" : invoice.status === "ISSUED" ? "amber" : invoice.status === "CANCELLED" ? "rose" : "slate"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <SectionCard eyebrow="Kullanım Özeti" title="Kullanıcı dostu genel durum">
            <div className="space-y-3">
              <div className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Bugün önerilen odak</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {receivableBalance >= payableBalance
                    ? "Tahsilat ve açık müşteri bakiyelerine odaklanmak daha kritik görünüyor."
                    : "Ödeme planı ve alış faturası vadeleri öncelikli görünüyor."}
                </p>
              </div>
              <div className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Sistem özeti</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {formatNumber(invoices.length)} belge, {formatNumber(openQuotes)} açık teklif ve {formatCurrency(liquidityTotal)} toplam likidite ile çalışıyorsunuz.
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard eyebrow="Hızlı Yorum" title="Kolay kullanıcı özeti">
            <div className="space-y-3">
              <div className="rounded-[16px] border border-sky-100 bg-sky-50/70 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sky-500">Satış durumu</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">Satış hacmi alış tarafının {totalPurchases > 0 ? `%${formatNumber(Math.round((totalSales / totalPurchases) * 100))}` : "-"} seviyesinde.</p>
              </div>
              <div className="rounded-[16px] border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-500">Likidite görünümü</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">Kasalar ve bankalar toplamında {formatCurrency(liquidityTotal)} kaynak hazır durumda.</p>
              </div>
            </div>
          </SectionCard>
        </section>
      </div>
    </AppShell>
  );
}

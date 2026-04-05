import Link from "next/link";
import { DocumentDialogActions } from "@/components/actions/document-dialog-actions";
import { AppShell } from "@/components/ui/app-shell";
import { QuickActionLink, SectionCard, StatRow, StatusPill, SummaryCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { membership, tenant, user } = await getTenantContext();
  const params = (await searchParams) ?? {};
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const directionFilter = params.direction === "SALES" || params.direction === "PURCHASE" ? params.direction : "all";
  const statusFilter = typeof params.status === "string" ? params.status : "all";

  const [invoices, salesCount, purchaseCount, unpaidCount, customers, suppliers, products, draftDocuments] = await Promise.all([
    db.invoice.findMany({ where: { tenantId: tenant.id }, orderBy: { issueDate: "desc" }, include: { customer: true, supplier: true, payments: true, eInvoiceDocument: true, items: true } }),
    db.invoice.count({ where: { tenantId: tenant.id, direction: "SALES" } }),
    db.invoice.count({ where: { tenantId: tenant.id, direction: "PURCHASE" } }),
    db.invoice.count({ where: { tenantId: tenant.id, status: { in: ["ISSUED", "PARTIAL"] } } }),
    db.customer.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
    db.supplier.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
    db.product.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
    db.eInvoiceDocument.count({ where: { tenantId: tenant.id, status: { in: ["DRAFT", "READY"] } } }),
  ]);

  const filteredInvoices = invoices.filter((invoice) => {
    const counterparty = `${invoice.customer?.name ?? ""} ${invoice.supplier?.name ?? ""}`.toLowerCase();
    const matchesQuery = !query || invoice.invoiceNo.toLowerCase().includes(query) || counterparty.includes(query);
    const matchesDirection = directionFilter === "all" || invoice.direction === directionFilter;
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesQuery && matchesDirection && matchesStatus;
  });

  const totalSales = invoices.filter((item) => item.direction === "SALES").reduce((sum, item) => sum + Number(item.grandTotal), 0);
  const totalPurchase = invoices.filter((item) => item.direction === "PURCHASE").reduce((sum, item) => sum + Number(item.grandTotal), 0);
  const totalOutstanding = invoices.reduce((sum, item) => sum + Math.max(Number(item.grandTotal) - Number(item.paidTotal), 0), 0);
  const nextSalesNo = `SAT-${String(salesCount + 1).padStart(5, "0")}`;

  return (
    <AppShell
      title="Satış ve Alış Faturaları"
      subtitle={`${tenant.name} için satış, alış ve e-Belge üretim akışı`}
      currentPath="/panel/faturalar"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<QuickActionLink href="/panel/faturalar/yeni" label="Yeni Fatura" />}
    >
      <div className="space-y-6">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Satış faturaları" value={formatNumber(salesCount)} detail={formatCurrency(totalSales)} accent="border-l-4 border-l-sky-500 border-[var(--line)]" />
          <SummaryCard title="Alış faturaları" value={formatNumber(purchaseCount)} detail={formatCurrency(totalPurchase)} accent="border-l-4 border-l-amber-500 border-[var(--line)]" />
          <SummaryCard title="Bekleyen tahsilat" value={formatNumber(unpaidCount)} detail={formatCurrency(totalOutstanding)} accent="border-l-4 border-l-rose-500 border-[var(--line)]" />
          <SummaryCard title="e-Belge kuyruğu" value={formatNumber(draftDocuments)} detail="Taslak veya gönderime hazır belge" accent="border-l-4 border-l-emerald-500 border-[var(--line)]" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <SectionCard eyebrow="Hızlı İşlem" title="Belge operasyonu" action={<Link href="/panel/teklif-siparis" className="text-sm font-bold text-[var(--brand)]">Sipariş akışını aç</Link>}>
            <div className="space-y-3">
              <StatRow label="Sonraki satış belge no" value={nextSalesNo} />
              <StatRow label="Müşteri kartı" value={formatNumber(customers.length)} />
              <StatRow label="Tedarikçi kartı" value={formatNumber(suppliers.length)} />
              <StatRow label="Ürün kartı" value={formatNumber(products.length)} />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link href="/panel/cari" className="rounded-[10px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-white">Cari kartları yönet</Link>
              <Link href="/panel/stok" className="rounded-[10px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-white">Ürün kartlarını aç</Link>
            </div>
          </SectionCard>

          <SectionCard eyebrow="Belge Akışı" title="Fatura işlemlerini ayrı sayfadan başlat">
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/panel/faturalar/yeni" className="rounded-[10px] border border-[var(--line)] bg-white px-4 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Yeni satış / alış faturası oluştur
              </Link>
              <Link href="/panel/ayarlar/e-fatura" className="rounded-[10px] border border-[var(--line)] bg-white px-4 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
                e-Fatura ayarlarını aç
              </Link>
              <Link href="/panel/cari/musteri/yeni" className="rounded-[10px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4 text-sm font-semibold text-slate-700 hover:bg-white">
                Yeni müşteri ekle
              </Link>
              <Link href="/panel/stok/yeni" className="rounded-[10px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4 text-sm font-semibold text-slate-700 hover:bg-white">
                Yeni ürün / hizmet ekle
              </Link>
            </div>
          </SectionCard>
        </section>

        <SectionCard eyebrow="Belge Listesi" title="Fatura kayıtları" action={<Link href="/panel/faturalar" className="text-sm font-bold text-[var(--brand)]">Filtreyi temizle</Link>}>
          <form className="mb-5 grid gap-3 rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
            <input name="q" defaultValue={query} placeholder="Belge no veya cari ara" />
            <select name="direction" defaultValue={directionFilter}>
              <option value="all">Tüm yönler</option>
              <option value="SALES">Satış</option>
              <option value="PURCHASE">Alış</option>
            </select>
            <select name="status" defaultValue={statusFilter}>
              <option value="all">Tüm durumlar</option>
              <option value="DRAFT">Taslak</option>
              <option value="ISSUED">Kesildi</option>
              <option value="PARTIAL">Kısmi</option>
              <option value="PAID">Ödendi</option>
              <option value="CANCELLED">İptal</option>
            </select>
            <button className="rounded-[10px] bg-[var(--brand)] px-4 py-3 text-sm font-extrabold text-white hover:bg-[var(--brand-strong)]">Filtrele</button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="bg-[var(--panel-soft)] text-[11px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Belge No</th>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Cari</th>
                  <th className="px-4 py-3">Yön</th>
                  <th className="px-4 py-3">Tutar</th>
                  <th className="px-4 py-3">Ödenen</th>
                  <th className="px-4 py-3">Kalan</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3">e-Belge</th>
                  <th className="px-4 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {filteredInvoices.map((invoice) => {
                  const outstanding = Math.max(Number(invoice.grandTotal) - Number(invoice.paidTotal), 0);
                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-4 font-mono font-semibold text-slate-900">{invoice.invoiceNo}</td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(invoice.issueDate)}</td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{invoice.customer?.name ?? invoice.supplier?.name ?? "Genel kayıt"}</td>
                      <td className="px-4 py-4 text-slate-600">{invoice.direction === "SALES" ? "Satış" : "Alış"}</td>
                      <td className="px-4 py-4 font-extrabold text-slate-900">{formatCurrency(Number(invoice.grandTotal))}</td>
                      <td className="px-4 py-4 text-slate-700">{formatCurrency(Number(invoice.paidTotal))}</td>
                      <td className="px-4 py-4 text-slate-700">{formatCurrency(outstanding)}</td>
                      <td className="px-4 py-4">
                        <StatusPill label={invoice.status === "PAID" ? "Ödendi" : invoice.status === "PARTIAL" ? "Kısmi" : invoice.status === "ISSUED" ? "Kesildi" : invoice.status === "CANCELLED" ? "İptal" : "Taslak"} tone={invoice.status === "PAID" ? "emerald" : invoice.status === "PARTIAL" ? "blue" : invoice.status === "ISSUED" ? "amber" : invoice.status === "CANCELLED" ? "rose" : "slate"} />
                      </td>
                      <td className="px-4 py-4">
                        {invoice.eInvoiceDocument ? (
                          <StatusPill label={invoice.eInvoiceDocument.status} tone={invoice.eInvoiceDocument.status === "SENT" ? "emerald" : invoice.eInvoiceDocument.status === "READY" ? "blue" : invoice.eInvoiceDocument.status === "FAILED" ? "rose" : "amber"} />
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">Yok</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <DocumentDialogActions
                            title={invoice.invoiceNo}
                            endpoint={`/api/panel/invoices/${invoice.id}`}
                            deleteLabel={invoice.invoiceNo}
                            initialData={{
                              status: invoice.status,
                              dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().slice(0, 10) : "",
                              note: invoice.note ?? "",
                            }}
                            fields={[
                              { key: "status", label: "Durum", options: ["DRAFT", "ISSUED", "PARTIAL", "PAID", "CANCELLED"] },
                              { key: "dueDate", label: "Vade Tarihi", type: "date" },
                              { key: "note", label: "Not" },
                            ]}
                            initialItems={invoice.items.map((item) => ({
                              id: item.id,
                              productId: item.productId ?? "",
                              quantity: String(Number(item.quantity)),
                              unitPrice: String(Number(item.unitPrice)),
                              vatRate: String(Number(item.vatRate)),
                            }))}
                            products={products.map((product) => ({ id: product.id, code: product.code, name: product.name }))}
                          />
                          <Link href="/panel/finans/tahsilat-odeme/yeni" className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[var(--panel-soft)]">Tahsilat</Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}






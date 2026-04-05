import Link from "next/link";
import { DocumentDialogActions } from "@/components/actions/document-dialog-actions";
import { OrderToInvoiceButton } from "@/components/actions/order-to-invoice-button";
import { AppShell } from "@/components/ui/app-shell";
import { QuickActionLink, SectionCard, StatusPill } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { membership, tenant, user } = await getTenantContext();
  const params = (await searchParams) ?? {};
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const statusFilter = typeof params.status === "string" ? params.status : "all";

  const [orders, products] = await Promise.all([
    db.salesOrder.findMany({ where: { tenantId: tenant.id }, include: { customer: true, items: true, invoices: true }, orderBy: { issueDate: "desc" } }),
    db.product.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
  ]);

  const filteredOrders = orders.filter((order) => {
    const matchesQuery = !query || order.orderNo.toLowerCase().includes(query) || order.customer?.name.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <AppShell
      title="Siparişler"
      subtitle="Bu ekran yalnızca sipariş kayıtlarını gösterir. Yeni sipariş ayrı sayfadan açılır."
      currentPath="/panel/siparisler"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<QuickActionLink href="/panel/teklif-siparis/siparis/yeni" label="Yeni Sipariş" />}
    >
      <SectionCard eyebrow="Sipariş Listesi" title="Sipariş kayıtları" action={<Link href="/panel/siparisler" className="text-sm font-bold text-[var(--brand)]">Filtreyi temizle</Link>}>
        <form className="mb-5 grid gap-3 rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 lg:grid-cols-[1.3fr_0.8fr_auto]">
          <input name="q" defaultValue={query} placeholder="Sipariş no veya müşteri ara" />
          <select name="status" defaultValue={statusFilter}>
            <option value="all">Tüm sipariş durumları</option>
            <option value="DRAFT">Taslak</option>
            <option value="APPROVED">Onaylı</option>
            <option value="INVOICED">Faturalandı</option>
            <option value="CANCELLED">İptal</option>
          </select>
          <button className="rounded-[10px] bg-[var(--brand)] px-4 py-3 text-sm font-extrabold text-white hover:bg-[var(--brand-strong)]">Filtrele</button>
        </form>

        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div key={order.id} className="rounded-[12px] border border-[var(--line)] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold text-slate-900">{order.orderNo}</p>
                  <p className="mt-1 text-sm text-slate-600">{order.customer?.name ?? "Müşteri seçilmedi"} · {formatDate(order.issueDate)}</p>
                  <p className="mt-2 text-xs text-slate-500">{order.items.length} kalem · {formatCurrency(Number(order.grandTotal))}</p>
                </div>
                <StatusPill label={order.status === "INVOICED" ? "Faturalandı" : order.status === "APPROVED" ? "Onaylı" : order.status === "CANCELLED" ? "İptal" : "Taslak"} tone={order.status === "INVOICED" ? "emerald" : order.status === "APPROVED" ? "blue" : order.status === "CANCELLED" ? "rose" : "slate"} />
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm">
                  <span className="text-slate-500">Bağlı fatura</span>
                  <p className="mt-1 font-extrabold text-slate-900">{formatNumber(order.invoices.length)}</p>
                </div>
                <DocumentDialogActions
                  title={order.orderNo}
                  endpoint={`/api/panel/orders/${order.id}`}
                  deleteLabel={order.orderNo}
                  initialData={{
                    status: order.status,
                    note: order.note ?? "",
                  }}
                  fields={[
                    { key: "status", label: "Durum", options: ["DRAFT", "APPROVED", "CANCELLED", "INVOICED"] },
                    { key: "note", label: "Not" },
                  ]}
                  initialItems={order.items.map((item) => ({
                    id: item.id,
                    productId: item.productId ?? "",
                    quantity: String(Number(item.quantity)),
                    unitPrice: String(Number(item.unitPrice)),
                    vatRate: String(Number(item.vatRate)),
                  }))}
                  products={products.map((product) => ({ id: product.id, code: product.code, name: product.name }))}
                />
                {order.status !== "INVOICED" ? <OrderToInvoiceButton orderId={order.id} /> : null}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}

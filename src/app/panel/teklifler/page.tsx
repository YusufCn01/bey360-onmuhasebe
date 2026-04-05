import Link from "next/link";
import { DocumentDialogActions } from "@/components/actions/document-dialog-actions";
import { QuoteToOrderButton } from "@/components/actions/quote-to-order-button";
import { AppShell } from "@/components/ui/app-shell";
import { QuickActionLink, SectionCard, StatusPill } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

export default async function QuotesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { membership, tenant, user } = await getTenantContext();
  const params = (await searchParams) ?? {};
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const statusFilter = typeof params.status === "string" ? params.status : "all";

  const [quotes, products] = await Promise.all([
    db.quote.findMany({ where: { tenantId: tenant.id }, include: { customer: true, items: true }, orderBy: { issueDate: "desc" } }),
    db.product.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
  ]);

  const filteredQuotes = quotes.filter((quote) => {
    const matchesQuery = !query || quote.quoteNo.toLowerCase().includes(query) || quote.customer?.name.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <AppShell
      title="Teklifler"
      subtitle="Bu ekran yalnızca teklif kayıtlarını gösterir. Yeni teklif ayrı sayfadan açılır."
      currentPath="/panel/teklifler"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<QuickActionLink href="/panel/teklif-siparis/teklif/yeni" label="Yeni Teklif" />}
    >
      <SectionCard eyebrow="Teklif Listesi" title="Teklif kayıtları" action={<Link href="/panel/teklifler" className="text-sm font-bold text-[var(--brand)]">Filtreyi temizle</Link>}>
        <form className="mb-5 grid gap-3 rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 lg:grid-cols-[1.3fr_0.8fr_auto]">
          <input name="q" defaultValue={query} placeholder="Teklif no veya müşteri ara" />
          <select name="status" defaultValue={statusFilter}>
            <option value="all">Tüm teklif durumları</option>
            <option value="DRAFT">Taslak</option>
            <option value="SENT">Gönderildi</option>
            <option value="APPROVED">Onaylandı</option>
            <option value="REJECTED">Reddedildi</option>
          </select>
          <button className="rounded-[10px] bg-[var(--brand)] px-4 py-3 text-sm font-extrabold text-white hover:bg-[var(--brand-strong)]">Filtrele</button>
        </form>

        <div className="space-y-3">
          {filteredQuotes.map((quote) => (
            <div key={quote.id} className="rounded-[12px] border border-[var(--line)] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold text-slate-900">{quote.quoteNo}</p>
                  <p className="mt-1 text-sm text-slate-600">{quote.customer?.name ?? "Müşteri seçilmedi"} · {formatDate(quote.issueDate)}</p>
                  <p className="mt-2 text-xs text-slate-500">{quote.items.length} kalem · {formatCurrency(Number(quote.grandTotal))}</p>
                </div>
                <StatusPill label={quote.status === "APPROVED" ? "Onaylandı" : quote.status === "SENT" ? "Gönderildi" : quote.status === "REJECTED" ? "Reddedildi" : "Taslak"} tone={quote.status === "APPROVED" ? "emerald" : quote.status === "SENT" ? "blue" : quote.status === "REJECTED" ? "rose" : "slate"} />
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm">
                  <span className="text-slate-500">Geçerlilik</span>
                  <p className="mt-1 font-extrabold text-slate-900">{quote.validUntil ? formatDate(quote.validUntil) : "Belirtilmedi"}</p>
                </div>
                <Link href={`/panel/onizleme/teklif/${quote.id}`} className="inline-flex items-center justify-center rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
                  Şablonlu Önizle
                </Link>
                <DocumentDialogActions
                  title={quote.quoteNo}
                  endpoint={`/api/panel/quotes/${quote.id}`}
                  deleteLabel={quote.quoteNo}
                  initialData={{
                    status: quote.status,
                    validUntil: quote.validUntil ? new Date(quote.validUntil).toISOString().slice(0, 10) : "",
                    note: quote.note ?? "",
                  }}
                  fields={[
                    { key: "status", label: "Durum", options: ["DRAFT", "SENT", "APPROVED", "REJECTED"] },
                    { key: "validUntil", label: "Geçerlilik", type: "date" },
                    { key: "note", label: "Not" },
                  ]}
                  initialItems={quote.items.map((item) => ({
                    id: item.id,
                    productId: item.productId ?? "",
                    quantity: String(Number(item.quantity)),
                    unitPrice: String(Number(item.unitPrice)),
                    vatRate: String(Number(item.vatRate)),
                  }))}
                  products={products.map((product) => ({ id: product.id, code: product.code, name: product.name }))}
                />
                <QuoteToOrderButton quoteId={quote.id} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}

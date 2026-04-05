import Link from "next/link";
import { DispatchToInvoiceButton } from "@/components/actions/dispatch-to-invoice-button";
import { AppShell } from "@/components/ui/app-shell";
import { QuickActionLink, SectionCard, StatusPill } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

export default async function DispatchNotesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { membership, tenant, user } = await getTenantContext();
  const params = (await searchParams) ?? {};
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";

  const dispatchNotes = await db.dispatchNote.findMany({
    where: { tenantId: tenant.id, direction: "SALES" },
    include: { customer: true, items: true, invoice: true },
    orderBy: { issueDate: "desc" },
  });

  const filtered = dispatchNotes.filter((item) => {
    if (!query) return true;
    return item.dispatchNo.toLowerCase().includes(query) || item.customer?.name.toLowerCase().includes(query);
  });

  return (
    <AppShell
      title="Satış İrsaliyeleri"
      subtitle="Sevk ve teslim belgelerini ayrı modülden yönetin. Fatura akışından bağımsız, daha sade bir operasyon ekranı."
      currentPath="/panel/irsaliyeler"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<QuickActionLink href="/panel/irsaliyeler/yeni" label="Yeni İrsaliye" />}
    >
      <SectionCard eyebrow="İrsaliye Listesi" title="Satış irsaliyesi kayıtları" action={<Link href="/panel/irsaliyeler" className="text-sm font-bold text-[var(--brand)]">Filtreyi temizle</Link>}>
        <form className="mb-5 grid gap-3 rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 lg:grid-cols-[1fr_auto]">
          <input name="q" defaultValue={query} placeholder="İrsaliye no veya müşteri ara" />
          <button className="rounded-[10px] bg-[var(--brand)] px-4 py-3 text-sm font-extrabold text-white hover:bg-[var(--brand-strong)]">Filtrele</button>
        </form>

        <div className="space-y-3">
          {filtered.map((dispatchNote) => (
            <div key={dispatchNote.id} className="rounded-[12px] border border-[var(--line)] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold text-slate-900">{dispatchNote.dispatchNo}</p>
                  <p className="mt-1 text-sm text-slate-600">{dispatchNote.customer?.name ?? "Müşteri seçilmedi"} · {formatDate(dispatchNote.issueDate)}</p>
                  <p className="mt-2 text-xs text-slate-500">{dispatchNote.items.length} kalem · {formatCurrency(Number(dispatchNote.grandTotal))}</p>
                </div>
                <StatusPill
                  label={dispatchNote.status === "INVOICED" ? "Faturalandı" : dispatchNote.status === "CANCELLED" ? "İptal" : dispatchNote.status === "ISSUED" ? "Kesildi" : "Taslak"}
                  tone={dispatchNote.status === "INVOICED" ? "emerald" : dispatchNote.status === "CANCELLED" ? "rose" : dispatchNote.status === "ISSUED" ? "blue" : "slate"}
                />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm">
                  <span className="text-slate-500">Teslim tarihi</span>
                  <p className="mt-1 font-extrabold text-slate-900">{dispatchNote.deliveryDate ? formatDate(dispatchNote.deliveryDate) : "Belirtilmedi"}</p>
                </div>
                <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm">
                  <span className="text-slate-500">Ara toplam</span>
                  <p className="mt-1 font-extrabold text-slate-900">{formatCurrency(Number(dispatchNote.subtotal))}</p>
                </div>
                <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm">
                  <span className="text-slate-500">Not</span>
                  <p className="mt-1 font-extrabold text-slate-900">{dispatchNote.note ?? "Açıklama yok"}</p>
                </div>
                <div className="flex flex-col items-start gap-2 rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm">
                  {dispatchNote.invoice ? (
                    <Link
                      href={`/panel/onizleme/fatura/${dispatchNote.invoice.id}`}
                      className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      Bağlı Fatura: {dispatchNote.invoice.invoiceNo}
                    </Link>
                  ) : null}
                  <Link href={`/panel/onizleme/irsaliye/${dispatchNote.id}`} className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    Şablonlu Önizle
                  </Link>
                  {dispatchNote.status !== "INVOICED" ? <DispatchToInvoiceButton dispatchNoteId={dispatchNote.id} /> : <span className="text-xs font-semibold text-emerald-600">Bu irsaliye faturalandı.</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}

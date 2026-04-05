import Link from "next/link";
import { DownloadEInvoiceXmlLink } from "@/components/actions/download-einvoice-xml-link";
import { DocumentDialogActions } from "@/components/actions/document-dialog-actions";
import { SendEInvoiceButton } from "@/components/actions/send-einvoice-button";
import { AppShell } from "@/components/ui/app-shell";
import { QuickActionLink, SectionCard, StatusPill } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

type InvoiceDirectionMode = "SALES" | "PURCHASE";

export async function InvoiceListPage({
  direction,
  title,
  subtitle,
  currentPath,
}: {
  direction: InvoiceDirectionMode;
  title: string;
  subtitle: string;
  currentPath: string;
}) {
  const { membership, tenant, user } = await getTenantContext();

  const [invoices, products] = await Promise.all([
    db.invoice.findMany({
      where: { tenantId: tenant.id, direction },
      orderBy: { issueDate: "desc" },
      include: { customer: true, supplier: true, eInvoiceDocument: true, items: true, dispatchNote: true },
    }),
    db.product.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
  ]);

  const createHref = direction === "SALES" ? "/panel/satis-faturalari/yeni" : "/panel/alis-faturalari/yeni";

  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      currentPath={currentPath}
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<QuickActionLink href={createHref} label={direction === "SALES" ? "Yeni Satış Faturası" : "Yeni Alış Faturası"} />}
    >
      <SectionCard
        eyebrow="Belge Listesi"
        title={direction === "SALES" ? "Satış faturaları" : "Alış faturaları"}
        action={<span className="text-sm font-semibold text-slate-500">Toplam kayıt: {invoices.length}</span>}
      >
        <div className="space-y-4 lg:hidden">
          {invoices.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-[var(--line)] bg-white px-4 py-10 text-center text-sm text-slate-500">
              Henüz kayıt bulunmuyor.
            </div>
          ) : (
            invoices.map((invoice) => {
              const outstanding = Math.max(Number(invoice.grandTotal) - Number(invoice.paidTotal), 0);
              const eDocument = invoice.eInvoiceDocument;

              return (
                <article key={invoice.id} className="rounded-[20px] border border-[var(--line)] bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-extrabold text-slate-900">{invoice.invoiceNo}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{formatDate(invoice.issueDate)}</p>
                    </div>
                    <StatusPill
                      label={invoice.status === "PAID" ? "Ödendi" : invoice.status === "PARTIAL" ? "Kısmi" : invoice.status === "ISSUED" ? "Kesildi" : invoice.status === "CANCELLED" ? "İptal" : "Taslak"}
                      tone={invoice.status === "PAID" ? "emerald" : invoice.status === "PARTIAL" ? "blue" : invoice.status === "ISSUED" ? "amber" : invoice.status === "CANCELLED" ? "rose" : "slate"}
                    />
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Cari</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{invoice.customer?.name ?? invoice.supplier?.name ?? "Genel kayıt"}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Tutar</p>
                        <p className="mt-1 text-sm font-extrabold text-slate-900">{formatCurrency(Number(invoice.grandTotal))}</p>
                      </div>
                      <div className="rounded-[14px] border border-emerald-100 bg-emerald-50 px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-500">Ödenen</p>
                        <p className="mt-1 text-sm font-extrabold text-emerald-700">{formatCurrency(Number(invoice.paidTotal))}</p>
                      </div>
                      <div className="rounded-[14px] border border-amber-100 bg-amber-50 px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-500">Kalan</p>
                        <p className="mt-1 text-sm font-extrabold text-amber-700">{formatCurrency(outstanding)}</p>
                      </div>
                    </div>

                    {eDocument ? (
                      <div className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill
                            label={eDocument.status}
                            tone={eDocument.status === "SENT" ? "emerald" : eDocument.status === "READY" ? "blue" : eDocument.status === "FAILED" ? "rose" : "amber"}
                          />
                          <StatusPill label={eDocument.scenario === "E_ARCHIVE" ? "e-Arşiv" : "e-Fatura"} tone="slate" />
                        </div>
                        <div className="mt-2 space-y-1 text-xs text-slate-500">
                          <p>Belge UUID: <span className="font-mono text-slate-700">{eDocument.envelopeUuid ?? "-"}</span></p>
                          <p>Alıcı URN: <span className="font-mono text-slate-700">{eDocument.destinationUrn ?? "-"}</span></p>
                          <p className="line-clamp-2">{eDocument.responseNote ?? "Henüz gönderim notu yok"}</p>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <DownloadEInvoiceXmlLink documentId={eDocument.id} />
                          {direction === "SALES" && eDocument.status !== "SENT" ? <SendEInvoiceButton documentId={eDocument.id} /> : null}
                        </div>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      {invoice.dispatchNote ? (
                        <Link
                          href={`/panel/onizleme/irsaliye/${invoice.dispatchNote.id}`}
                          className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          Kaynak İrsaliye
                        </Link>
                      ) : null}
                      <Link href={`/panel/onizleme/fatura/${invoice.id}`} className="rounded-[10px] border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-[var(--panel-soft)]">
                        Şablonlu Önizle
                      </Link>
                      <Link href="/panel/finans/tahsilat-odeme/yeni" className="rounded-[10px] border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-[var(--panel-soft)]">
                        {direction === "SALES" ? "Tahsilat" : "Ödeme"}
                      </Link>
                    </div>

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
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1380px] text-left text-sm">
            <thead className="bg-[var(--panel-soft)] text-[11px] uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Belge No</th>
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3">Cari</th>
                <th className="px-4 py-3">Tutar</th>
                <th className="px-4 py-3">Ödenen</th>
                <th className="px-4 py-3">Kalan</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">e-Belge</th>
                <th className="px-4 py-3">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {invoices.map((invoice) => {
                const outstanding = Math.max(Number(invoice.grandTotal) - Number(invoice.paidTotal), 0);
                const eDocument = invoice.eInvoiceDocument;

                return (
                  <tr key={invoice.id} className="hover:bg-slate-50/80 align-top">
                    <td className="px-4 py-4 font-mono font-semibold text-slate-900">{invoice.invoiceNo}</td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(invoice.issueDate)}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">{invoice.customer?.name ?? invoice.supplier?.name ?? "Genel kayıt"}</td>
                    <td className="px-4 py-4 font-extrabold text-slate-900">{formatCurrency(Number(invoice.grandTotal))}</td>
                    <td className="px-4 py-4 text-slate-700">{formatCurrency(Number(invoice.paidTotal))}</td>
                    <td className="px-4 py-4 text-slate-700">{formatCurrency(outstanding)}</td>
                    <td className="px-4 py-4">
                      <StatusPill
                        label={invoice.status === "PAID" ? "Ödendi" : invoice.status === "PARTIAL" ? "Kısmi" : invoice.status === "ISSUED" ? "Kesildi" : invoice.status === "CANCELLED" ? "İptal" : "Taslak"}
                        tone={invoice.status === "PAID" ? "emerald" : invoice.status === "PARTIAL" ? "blue" : invoice.status === "ISSUED" ? "amber" : invoice.status === "CANCELLED" ? "rose" : "slate"}
                      />
                    </td>
                    <td className="px-4 py-4">
                      {eDocument ? (
                        <div className="space-y-2 rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusPill
                              label={eDocument.status}
                              tone={eDocument.status === "SENT" ? "emerald" : eDocument.status === "READY" ? "blue" : eDocument.status === "FAILED" ? "rose" : "amber"}
                            />
                            <StatusPill label={eDocument.scenario === "E_ARCHIVE" ? "e-Arşiv" : "e-Fatura"} tone="slate" />
                          </div>
                          <div className="space-y-1 text-xs text-slate-500">
                            <p>Sağlayıcı: <span className="font-semibold text-slate-700">{eDocument.provider}</span></p>
                            <p>Belge UUID: <span className="font-mono text-slate-700">{eDocument.envelopeUuid ?? "-"}</span></p>
                            <p>Alıcı URN: <span className="font-mono text-slate-700">{eDocument.destinationUrn ?? "-"}</span></p>
                            <p className="line-clamp-2">{eDocument.responseNote ?? "Henüz gönderim notu yok"}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <DownloadEInvoiceXmlLink documentId={eDocument.id} />
                            {direction === "SALES" && eDocument.status !== "SENT" ? <SendEInvoiceButton documentId={eDocument.id} /> : null}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">Yok</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-start gap-2">
                        {invoice.dispatchNote ? (
                          <Link
                            href={`/panel/onizleme/irsaliye/${invoice.dispatchNote.id}`}
                            className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            Kaynak İrsaliye: {invoice.dispatchNote.dispatchNo}
                          </Link>
                        ) : null}
                        <Link href={`/panel/onizleme/fatura/${invoice.id}`} className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[var(--panel-soft)]">
                          Şablonlu Önizle
                        </Link>
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
                        <Link href="/panel/finans/tahsilat-odeme/yeni" className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[var(--panel-soft)]">
                          {direction === "SALES" ? "Tahsilat" : "Ödeme"}
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </AppShell>
  );
}

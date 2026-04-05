import { DownloadEInvoiceXmlLink } from "@/components/actions/download-einvoice-xml-link";
import { SendEInvoiceButton } from "@/components/actions/send-einvoice-button";
import { EInvoiceSettingsForm } from "@/components/forms/einvoice-settings-form";
import { AppShell } from "@/components/ui/app-shell";
import { QuickActionLink, SectionCard, StatusPill, SummaryCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

export default async function EInvoiceSettingsPage() {
  const { membership, tenant, user } = await getTenantContext();
  const [settings, documents] = await Promise.all([
    db.eInvoiceSettings.findUnique({ where: { tenantId: tenant.id } }),
    db.eInvoiceDocument.findMany({
      where: { tenantId: tenant.id },
      include: { invoice: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const sentCount = documents.filter((document) => document.status === "SENT").length;
  const readyCount = documents.filter((document) => document.status === "READY").length;
  const failedCount = documents.filter((document) => document.status === "FAILED").length;

  return (
    <AppShell
      title="e-Fatura Ayarları"
      subtitle="GİB e-Arşiv ve e-Fatura çalışma şekli için ana ayarlar burada tutulur."
      currentPath="/panel/ayarlar/e-fatura"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} · ${tenant.planName}`}
      topAction={<QuickActionLink href="/panel/ayarlar/hizli-bilisim" label="Hızlı Bilişim" />}
    >
      <div className="space-y-6">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Sağlayıcı"
            value={settings?.provider ?? "NONE"}
            detail="Aktif e-Belge servisi"
            accent="border-l-4 border-l-sky-500 border-[var(--line)]"
          />
          <SummaryCard
            title="Otomatik taslak"
            value={settings?.autoSend ? "Açık" : "Kapalı"}
            detail="Fatura sonrası taslak üretimi"
            accent="border-l-4 border-l-amber-500 border-[var(--line)]"
          />
          <SummaryCard
            title="Gönderilen"
            value={String(sentCount)}
            detail="Başarıyla iletilen belge"
            accent="border-l-4 border-l-emerald-500 border-[var(--line)]"
          />
          <SummaryCard
            title="Bekleyen / Hatalı"
            value={`${readyCount} / ${failedCount}`}
            detail="Kuyruk takibi için canlı durum"
            accent="border-l-4 border-l-rose-500 border-[var(--line)]"
          />
        </section>

        <SectionCard eyebrow="Ana Ayarlar" title="e-Belge davranışını belirle">
          <EInvoiceSettingsForm
            initial={{
              provider: (settings?.provider as "NONE" | "GIB" | "HIZLI_BILISIM") ?? "NONE",
              senderTitle: settings?.senderTitle ?? "",
              senderTaxNumber: settings?.senderTaxNumber ?? "",
              gibAlias: settings?.gibAlias ?? "",
              archiveEnabled: settings?.archiveEnabled ?? true,
              autoSend: settings?.autoSend ?? false,
              testMode: settings?.testMode ?? true,
            }}
          />
        </SectionCard>

        <SectionCard eyebrow="Belge Kuyruğu" title="Oluşan e-Belge taslakları ve gönderim detayları">
          <div className="space-y-3">
            {documents.map((document) => (
              <div key={document.id} className="rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-extrabold text-slate-900">{document.invoice.invoiceNo}</p>
                        <StatusPill
                          label={document.status}
                          tone={
                            document.status === "SENT"
                              ? "emerald"
                              : document.status === "READY"
                                ? "blue"
                                : document.status === "FAILED"
                                  ? "rose"
                                  : "amber"
                          }
                        />
                        <StatusPill label={document.scenario === "E_ARCHIVE" ? "e-Arşiv" : "e-Fatura"} tone="slate" />
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {formatDate(document.createdAt)} · {formatCurrency(Number(document.invoice.grandTotal))}
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-[12px] border border-[var(--line)] bg-white px-3 py-2.5 text-xs text-slate-500">
                        <p className="font-bold uppercase tracking-[0.14em] text-slate-400">Sağlayıcı</p>
                        <p className="mt-1 font-semibold text-slate-700">{document.provider}</p>
                      </div>
                      <div className="rounded-[12px] border border-[var(--line)] bg-white px-3 py-2.5 text-xs text-slate-500">
                        <p className="font-bold uppercase tracking-[0.14em] text-slate-400">Harici ID</p>
                        <p className="mt-1 break-all font-mono text-slate-700">{document.externalId ?? "-"}</p>
                      </div>
                      <div className="rounded-[12px] border border-[var(--line)] bg-white px-3 py-2.5 text-xs text-slate-500">
                        <p className="font-bold uppercase tracking-[0.14em] text-slate-400">Belge UUID</p>
                        <p className="mt-1 break-all font-mono text-slate-700">{document.envelopeUuid ?? "-"}</p>
                      </div>
                      <div className="rounded-[12px] border border-[var(--line)] bg-white px-3 py-2.5 text-xs text-slate-500 md:col-span-2 xl:col-span-1">
                        <p className="font-bold uppercase tracking-[0.14em] text-slate-400">Gönderici URN</p>
                        <p className="mt-1 break-all font-mono text-slate-700">{document.sourceUrn ?? "-"}</p>
                      </div>
                      <div className="rounded-[12px] border border-[var(--line)] bg-white px-3 py-2.5 text-xs text-slate-500 md:col-span-2">
                        <p className="font-bold uppercase tracking-[0.14em] text-slate-400">Alıcı URN</p>
                        <p className="mt-1 break-all font-mono text-slate-700">{document.destinationUrn ?? "-"}</p>
                      </div>
                    </div>

                    <div className="rounded-[12px] border border-[var(--line)] bg-white px-3 py-3 text-sm text-slate-600">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Servis Notu</p>
                      <p className="mt-1">{document.responseNote ?? "Henüz gönderim notu yok."}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:w-[220px] xl:flex-col xl:items-stretch">
                    <DownloadEInvoiceXmlLink documentId={document.id} />
                    {document.status !== "SENT" ? <SendEInvoiceButton documentId={document.id} /> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

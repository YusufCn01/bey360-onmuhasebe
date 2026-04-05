import Link from "next/link";
import { EInvoiceProvider } from "@prisma/client";
import { ImportEDonusumButton } from "@/components/actions/import-edonusum-button";
import { AppShell } from "@/components/ui/app-shell";
import { QuickActionLink, SectionCard, StatusPill, SummaryCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { type EDonusumCategoryKey, eDonusumCategories } from "@/lib/e-donusum";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { getDocumentList, loginToHizliBilisim } from "@/lib/integrations/hizli-bilisim";
import { tenantNavGroups } from "@/lib/navigation";

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMoney(value?: number | null, currencyCode?: string | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  const currency = currencyCode && currencyCode.trim() ? currencyCode.trim() : "TRY";
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return formatCurrency(value);
  }
}

function parseDateInput(value?: string | null, fallback?: Date) {
  if (!value) {
    return fallback ?? new Date();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback ?? new Date();
  }

  return parsed;
}

function toInputDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export async function EDonusumListPage({
  categoryKey,
  filters,
}: {
  categoryKey: EDonusumCategoryKey;
  filters?: { start?: string; end?: string };
}) {
  const category = eDonusumCategories[categoryKey];
  const { membership, tenant, user } = await getTenantContext();
  const settings = await db.eInvoiceSettings.findUnique({ where: { tenantId: tenant.id } });

  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const startDate = parseDateInput(filters?.start, yearStart);
  startDate.setHours(0, 0, 0, 0);
  const endDate = parseDateInput(filters?.end, new Date());
  endDate.setHours(23, 59, 59, 999);

  let errorMessage: string | null = null;
  let documents: Awaited<ReturnType<typeof getDocumentList>>["documents"] = [];

  if (!settings || settings.provider !== EInvoiceProvider.HIZLI_BILISIM) {
    errorMessage = "Bu listeyi kullanmak için önce e-Fatura ayarlarında Hızlı Bilişim entegratörünü aktif etmelisiniz.";
  } else {
    try {
      const login = await loginToHizliBilisim(settings);
      if (!login.success) {
        errorMessage = login.note;
      } else {
        const result = await getDocumentList(
          settings,
          {
            appType: category.appType,
            startDate,
            endDate,
          },
          login,
        );

        if (!result.success) {
          errorMessage = result.note;
        } else {
          documents = result.documents;
        }
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Belge listesi alınamadı.";
    }
  }

  const latestIssueDate = documents[0]?.issueDate ?? null;
  const completedCount = documents.filter((item) => (item.envelopeExp ?? "").toLocaleUpperCase("tr-TR").includes("BAŞARI")).length;

  return (
    <AppShell
      title={category.title}
      subtitle={category.subtitle}
      currentPath={category.href}
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} · ${tenant.planName}`}
      topAction={<QuickActionLink href="/panel/ayarlar/hizli-bilisim" label="Hızlı Bilişim Ayarları" />}
    >
      <div className="space-y-6">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Toplam kayıt" value={formatNumber(documents.length)} detail="Seçili tarih aralığı" accent="border-l-4 border-l-sky-500 border-[var(--line)]" />
          <SummaryCard title="Başarılı zarf" value={formatNumber(completedCount)} detail="BAŞARI İLE TAMAMLANDI" accent="border-l-4 border-l-emerald-500 border-[var(--line)]" />
          <SummaryCard title="Son belge tarihi" value={latestIssueDate ? formatDate(latestIssueDate) : "-"} detail="IssueDate alanı" accent="border-l-4 border-l-amber-500 border-[var(--line)]" />
          <SummaryCard title="Servis aralığı" value={`${toInputDate(startDate)} → ${toInputDate(endDate)}`} detail="Aktif filtre" accent="border-l-4 border-l-violet-500 border-[var(--line)]" />
        </section>

        <SectionCard
          eyebrow="Filtre ve Liste"
          title={`${category.shortLabel} kayıtları`}
          action={<span className="text-sm font-semibold text-slate-500">Toplam: {formatNumber(documents.length)}</span>}
        >
          <form method="get" action={category.href} className="mb-5 grid gap-3 rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 md:grid-cols-[1fr_1fr_auto]">
            <label className="text-sm font-semibold text-slate-600">
              Başlangıç Tarihi
              <input
                type="date"
                name="start"
                defaultValue={toInputDate(startDate)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none"
              />
            </label>
            <label className="text-sm font-semibold text-slate-600">
              Bitiş Tarihi
              <input
                type="date"
                name="end"
                defaultValue={toInputDate(endDate)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none"
              />
            </label>
            <div className="flex items-end gap-2">
              <button type="submit" className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--brand)] px-4 text-sm font-extrabold text-white hover:bg-[var(--brand-strong)]">
                Filtrele
              </button>
              <Link href={category.href} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Sıfırla
              </Link>
            </div>
          </form>

          {errorMessage ? (
            <div className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">{errorMessage}</div>
          ) : documents.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-[var(--line)] bg-[var(--panel-soft)] px-4 py-8 text-sm text-slate-600">
              Bu kategori için Hızlı Bilişim servisinde görüntülenecek kayıt bulunamadı.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[16px] border border-[var(--line)]">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--line)] text-sm">
                  <thead className="bg-[var(--panel-soft)] text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Belge</th>
                      <th className="px-4 py-3">Cari</th>
                      <th className="px-4 py-3">Tutar</th>
                      <th className="px-4 py-3">Profil</th>
                      <th className="px-4 py-3">Durum</th>
                      <th className="px-4 py-3">Zarf</th>
                      <th className="px-4 py-3">UUID</th>
                      <th className="px-4 py-3">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)] bg-white">
                    {documents.map((document) => (
                      <tr key={`${document.appType}-${document.uuid}-${document.documentId}`} className="align-top hover:bg-slate-50/70">
                        <td className="px-4 py-4">
                          <p className="font-mono text-sm font-bold text-slate-900">{document.documentId ?? "-"}</p>
                          <p className="mt-1 text-xs text-slate-500">Belge tarihi: {document.issueDate ? formatDate(document.issueDate) : "-"}</p>
                          <p className="text-xs text-slate-400">Oluşturma: {formatDateTime(document.createdDate)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900">{document.targetTitle ?? "-"}</p>
                          <p className="mt-1 text-xs text-slate-500">{document.targetIdentifier ?? "Kimlik yok"}</p>
                          {document.targetAlias ? <p className="mt-1 max-w-[280px] truncate text-xs text-slate-400">{document.targetAlias}</p> : null}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-extrabold text-slate-900">{formatMoney(document.payableAmount, document.documentCurrencyCode)}</p>
                          <p className="mt-1 text-xs text-slate-500">KDV: {formatMoney(document.taxTotal, document.documentCurrencyCode)}</p>
                          {document.vatSummary ? <p className="mt-1 text-xs text-slate-400">{document.vatSummary}</p> : null}
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-2">
                            <StatusPill label={document.profileId ?? "-"} tone="blue" />
                            {document.isArchive ? <StatusPill label="Arşiv" tone="amber" /> : null}
                            {document.isRead ? <StatusPill label="Okundu" tone="emerald" /> : null}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900">{document.statusExp ?? "-"}</p>
                          <p className="mt-1 text-xs text-slate-500">Kod: {typeof document.status === "number" ? formatNumber(document.status) : "-"}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900">{document.envelopeExp ?? "-"}</p>
                          <p className="mt-1 text-xs text-slate-500">Kod: {typeof document.envelopeStatus === "number" ? formatNumber(document.envelopeStatus) : "-"}</p>
                          {document.message ? <p className="mt-1 max-w-[220px] text-xs text-slate-400">{document.message}</p> : null}
                        </td>
                        <td className="px-4 py-4">
                          <p className="max-w-[240px] break-all font-mono text-xs text-slate-700">{document.uuid ?? "-"}</p>
                          {document.envelopeUuid ? <p className="mt-1 max-w-[240px] break-all text-[11px] text-slate-400">Zarf: {document.envelopeUuid}</p> : null}
                          {document.localReferenceId ? <p className="mt-1 text-[11px] text-slate-400">Lokal ref: {document.localReferenceId}</p> : null}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex min-w-[160px] flex-col gap-2">
                            <Link
                              href={`/api/panel/e-donusum/document-file?appType=${document.appType}&uuid=${encodeURIComponent(document.uuid ?? "")}&type=XML&documentId=${encodeURIComponent(document.documentId ?? "belge")}`}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                              XML İndir
                            </Link>
                            <Link
                              href={`/api/panel/e-donusum/document-file?appType=${document.appType}&uuid=${encodeURIComponent(document.uuid ?? "")}&type=PDF&documentId=${encodeURIComponent(document.documentId ?? "belge")}`}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                              PDF İndir
                            </Link>
                            <Link
                              href={`/api/panel/e-donusum/document-file?appType=${document.appType}&uuid=${encodeURIComponent(document.uuid ?? "")}&type=HTML&documentId=${encodeURIComponent(document.documentId ?? "belge")}`}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                              HTML İndir
                            </Link>
                            {categoryKey === "gelenFaturalar" || categoryKey === "gelenIrsaliyeler" ? (
                              <ImportEDonusumButton appType={document.appType ?? category.appType} uuid={document.uuid ?? ""} documentId={document.documentId ?? ""} />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard eyebrow="Kısayollar" title="Diğer e-Dönüşüm listeleri">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {Object.values(eDonusumCategories).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-[14px] border px-4 py-4 transition ${item.href === category.href ? "border-[var(--brand)] bg-[var(--brand-soft)]" : "border-[var(--line)] bg-[var(--panel-soft)] hover:bg-white"}`}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Kategori</p>
                <p className="mt-2 text-sm font-extrabold text-slate-900">{item.shortLabel}</p>
                <p className="mt-1 text-xs text-slate-500">{item.title}</p>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

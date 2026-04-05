import Link from "next/link";
import { EInvoiceProvider } from "@prisma/client";
import { AppShell } from "@/components/ui/app-shell";
import { QuickActionLink, SectionCard, SummaryCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { eDonusumCategories } from "@/lib/e-donusum";
import { formatNumber } from "@/lib/format";
import { getDashboardInfo, loginToHizliBilisim } from "@/lib/integrations/hizli-bilisim";
import { tenantNavGroups } from "@/lib/navigation";

export default async function EDonusumPage() {
  const { membership, tenant, user } = await getTenantContext();
  const settings = await db.eInvoiceSettings.findUnique({ where: { tenantId: tenant.id } });

  let counts = {
    gelenFaturalar: 0,
    gidenFaturalar: 0,
    gidenEArsiv: 0,
    gelenIrsaliyeler: 0,
    gidenIrsaliyeler: 0,
  };
  let note = "Liste içerikleri Hızlı Bilişim servisinden alınır.";

  if (settings?.provider === EInvoiceProvider.HIZLI_BILISIM && settings.senderTaxNumber) {
    try {
      const login = await loginToHizliBilisim(settings);
      if (login.success) {
        const dashboard = await getDashboardInfo(settings, settings.senderTaxNumber, login);
        counts = {
          gelenFaturalar: dashboard.inboxCount ?? 0,
          gidenFaturalar: dashboard.outboxCount ?? 0,
          gidenEArsiv: dashboard.archiveCount ?? 0,
          gelenIrsaliyeler: dashboard.despatchInboxCount ?? 0,
          gidenIrsaliyeler: dashboard.despatchOutboxCount ?? 0,
        };
        note = dashboard.note || note;
      } else {
        note = login.note;
      }
    } catch (error) {
      note = error instanceof Error ? error.message : "Hızlı Bilişim özeti alınamadı.";
    }
  } else {
    note = "Önce Hızlı Bilişim ayarlarını aktif edip bağlantı testini çalıştırmanız gerekir.";
  }

  const cards = [
    { ...eDonusumCategories.gelenFaturalar, count: counts.gelenFaturalar, accent: 'border-l-4 border-l-sky-500 border-[var(--line)]' },
    { ...eDonusumCategories.gidenFaturalar, count: counts.gidenFaturalar, accent: 'border-l-4 border-l-emerald-500 border-[var(--line)]' },
    { ...eDonusumCategories.gidenEArsiv, count: counts.gidenEArsiv, accent: 'border-l-4 border-l-amber-500 border-[var(--line)]' },
    { ...eDonusumCategories.gelenIrsaliyeler, count: counts.gelenIrsaliyeler, accent: 'border-l-4 border-l-indigo-500 border-[var(--line)]' },
    { ...eDonusumCategories.gidenIrsaliyeler, count: counts.gidenIrsaliyeler, accent: 'border-l-4 border-l-rose-500 border-[var(--line)]' },
  ];

  return (
    <AppShell
      title="E-Dönüşüm"
      subtitle="Gelen ve giden e-Belgeleri tek merkezden yönetin; her kategori Hızlı Bilişim listesini doğrudan açar."
      currentPath="/panel/e-donusum"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} · ${tenant.planName}`}
      topAction={<QuickActionLink href="/panel/ayarlar/hizli-bilisim" label="Hızlı Bilişim Ayarları" />}
    >
      <div className="space-y-6">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {cards.map((card) => (
            <Link key={card.href} href={card.href}>
              <SummaryCard title={card.shortLabel} value={formatNumber(card.count)} detail={card.title} accent={card.accent} />
            </Link>
          ))}
        </section>

        <SectionCard eyebrow="Servis Notu" title="E-Dönüşüm operasyon merkezi">
          <div className="space-y-3 text-sm text-slate-600">
            <p>{note}</p>
            <p>Her alt menü, Hızlı Bilişim servisinden doğrudan liste alır. Bu ekranda toplam görünüm, hızlı geçiş ve kategori kontrolü tutulur.</p>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Kategoriler" title="Liste ekranlarına geçiş">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {cards.map((card) => (
              <Link key={card.href} href={card.href} className="rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4 transition hover:bg-white">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Liste</p>
                <p className="mt-2 text-sm font-extrabold text-slate-900">{card.shortLabel}</p>
                <p className="mt-1 text-xs text-slate-500">{card.subtitle}</p>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

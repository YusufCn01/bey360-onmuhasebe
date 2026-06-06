import Link from "next/link";
import { SectionCard, StatusPill, SummaryCard } from "@/components/ui/module-blocks";
import { formatCurrency, formatNumber } from "@/lib/format";
import { getInsightTone } from "@/lib/smart-finance-insights";

type InsightCard = {
  title: string;
  score: number;
  summary: string;
};

type Recommendation = {
  title: string;
  detail: string;
  href: string;
};

export function SmartFinanceInsightContent({
  tenantName,
  last30Sales,
  last30Purchases,
  receivableBalance,
  payableBalance,
  prev30Sales,
  openReminders,
  insightCards,
  recommendations,
  compact = false,
}: {
  tenantName: string;
  last30Sales: number;
  last30Purchases: number;
  receivableBalance: number;
  payableBalance: number;
  prev30Sales: number;
  openReminders: number;
  insightCards: InsightCard[];
  recommendations: Recommendation[];
  compact?: boolean;
}) {
  const salesVsPurchaseRatio = last30Purchases > 0 ? (last30Sales / last30Purchases) * 100 : 100;
  const netLiquidityGap = last30Sales + receivableBalance - payableBalance;
  const debtCoverageRatio = payableBalance > 0 ? (receivableBalance / payableBalance) * 100 : 100;

  if (compact) {
    return (
      <div className="space-y-6 text-slate-700">
        <section className="space-y-4 border-t border-slate-200 pt-5 text-[15px] leading-8">
          <p>
            <strong className="font-extrabold text-slate-900">Finansal Durum Özeti:</strong> Yapılan ERP veri analizinde,
            işletmenin gelir-gider dengesinde dikkat edilmesi gereken bir yapı görülüyor. Son 30 günlük hareketlere göre
            finans ve operasyon tarafı birlikte ele alınmalı.
          </p>

          <ul className="space-y-3 pl-5">
            <li className="list-disc">
              <strong className="font-extrabold text-slate-900">Gelir ve Gider Analizi:</strong> Toplam satış geliri {formatCurrency(last30Sales)},
              gerçekleşen alış hacmi {formatCurrency(last30Purchases)} seviyesinde. Satışların alışlara oranı yaklaşık %
              {formatNumber(Number(salesVsPurchaseRatio.toFixed(1)))} düzeyinde.
            </li>
            <li className="list-disc">
              <strong className="font-extrabold text-slate-900">Nakit Akışı ve Likidite Riski:</strong> Açık tahsilat {formatCurrency(receivableBalance)} ve
              açık ödeme {formatCurrency(payableBalance)}. Bu tablo dikkate alındığında yaklaşık {formatCurrency(netLiquidityGap)} seviyesinde net operasyonel
              denge oluşuyor.
            </li>
            <li className="list-disc">
              <strong className="font-extrabold text-slate-900">Borç Karşılama Oranı:</strong> Tahsil edilecek tutarın ödenecek toplamı karşılama oranı yaklaşık %
              {formatNumber(Number(debtCoverageRatio.toFixed(0)))}. {openReminders > 0
                ? `${formatNumber(openReminders)} gecikmiş hatırlatma bulunduğu için tahsilat disiplinini öne almak gerekiyor.`
                : "Gecikmiş hatırlatma görünmüyor; bu da operasyon akışının daha düzenli ilerlediğini gösteriyor."}
            </li>
          </ul>
        </section>

        <section className="space-y-4 text-[15px] leading-8">
          <p className="font-extrabold text-slate-900">Eyleme Geçirilebilir Öneriler:</p>
          <ul className="space-y-3 pl-5">
            {recommendations.slice(0, 3).map((item) => (
              <li key={item.title} className="list-disc">
                <strong className="font-extrabold text-slate-900">{item.title}:</strong> {item.detail}
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Son 30 gün satış" value={formatCurrency(last30Sales)} detail="Yakın dönem satış hacmi" accent="border-l-4 border-l-[var(--brand)] border-[var(--line)]" />
        <SummaryCard title="Son 30 gün alış" value={formatCurrency(last30Purchases)} detail="Yakın dönem alış hacmi" accent="border-l-4 border-l-slate-400 border-[var(--line)]" />
        <SummaryCard title="Açık tahsilat" value={formatCurrency(receivableBalance)} detail="Toplam müşteri bakiyesi" accent="border-l-4 border-l-emerald-500 border-[var(--line)]" />
        <SummaryCard title="Açık ödeme" value={formatCurrency(payableBalance)} detail="Toplam tedarikçi bakiyesi" accent="border-l-4 border-l-amber-500 border-[var(--line)]" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard eyebrow="Akıllı skorlar" title={`${tenantName} için öne çıkan sinyaller`}>
          <div className="grid gap-4">
            {insightCards.map((item) => (
              <div key={item.title} className="rounded-[18px] border border-[var(--line)] bg-white px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{item.summary}</p>
                  </div>
                  <StatusPill label={`${item.score}/100`} tone={getInsightTone(item.score)} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Yorum" title="Yapay zeka destekli kısa değerlendirme">
          <div className="space-y-3 text-sm leading-7 text-slate-600">
            <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 px-4 py-4">
              <p className="font-extrabold text-slate-900">Genel tablo</p>
              <p className="mt-2">
                Son 30 günde satış hacmi {formatCurrency(last30Sales)} seviyesinde. Açık tahsilat {formatCurrency(receivableBalance)} ve açık ödeme {formatCurrency(payableBalance)} olarak görünüyor.
              </p>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 px-4 py-4">
              <p className="font-extrabold text-slate-900">Trend yorumu</p>
              <p className="mt-2">
                {last30Sales >= prev30Sales
                  ? "Satış trendi önceki dönemin altında değil. Bu momentumu korumak için tahsilat ve teklif tarafını birlikte canlı tutmak iyi olur."
                  : "Satış trendi önceki döneme göre zayıflamış. Yeni müşteri, teklif ve kampanya tarafı daha görünür aksiyon gerektiriyor."}
              </p>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 px-4 py-4">
              <p className="font-extrabold text-slate-900">Operasyon notu</p>
              <p className="mt-2">
                {openReminders > 0
                  ? `Sistemde ${formatNumber(openReminders)} gecikmiş hatırlatma var. Bu kayıtlar kapanmadan finans ve operasyon görünümü tam temiz sayılmaz.`
                  : "Şu an gecikmiş hatırlatma görünmüyor. Operasyon akışı düzenli ilerliyor."}
              </p>
            </div>
          </div>
        </SectionCard>
      </section>

      <SectionCard eyebrow="Önerilen aksiyonlar" title="Bugün için en mantıklı adımlar">
        <div className="grid gap-3">
          {recommendations.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-[18px] border border-[var(--line)] bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-extrabold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{item.detail}</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
                  Aç
                </span>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

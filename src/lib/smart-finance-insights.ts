export function getInsightTone(score: number) {
  if (score >= 80) return "emerald" as const;
  if (score >= 55) return "blue" as const;
  if (score >= 35) return "amber" as const;
  return "rose" as const;
}

export function buildSmartFinanceInsights({
  last30Sales,
  prev30Sales,
  last30Purchases,
  receivableBalance,
  payableBalance,
  openReminders,
}: {
  last30Sales: number;
  prev30Sales: number;
  last30Purchases: number;
  receivableBalance: number;
  payableBalance: number;
  openReminders: number;
}) {
  const collectionHealth = last30Sales > 0 ? Math.max(0, 100 - Math.round((receivableBalance / last30Sales) * 100)) : 72;
  const marginPressure = last30Sales > 0 ? Math.max(0, 100 - Math.round((last30Purchases / last30Sales) * 100)) : 58;
  const growthMomentum =
    prev30Sales > 0 ? Math.max(0, Math.min(100, 50 + Math.round(((last30Sales - prev30Sales) / prev30Sales) * 100))) : 60;

  const insightCards = [
    {
      title: "Tahsilat sağlığı",
      score: collectionHealth,
      summary:
        receivableBalance > last30Sales * 0.4
          ? "Açık müşteri bakiyesi yüksek. Tahsilat planını sıkılaştırmak iyi olur."
          : "Tahsilat dengesi şu an sağlıklı görünüyor.",
    },
    {
      title: "Kârlılık baskısı",
      score: marginPressure,
      summary:
        last30Purchases > last30Sales * 0.8
          ? "Alış yükü satışa çok yakın. Fiyatlama ve maliyetleri gözden geçirmek faydalı."
          : "Satış ve maliyet dengesi yönetilebilir seviyede.",
    },
    {
      title: "Büyüme momentumu",
      score: growthMomentum,
      summary:
        last30Sales >= prev30Sales
          ? "Son 30 günlük satış performansı önceki dönemin üzerinde veya yakın."
          : "Satış momentumu zayıflamış görünüyor. Teklif ve yeni müşteri tarafı öne çıkmalı.",
    },
  ];

  const recommendations = [
    receivableBalance > last30Sales * 0.35
      ? {
          title: "Tahsilat takibini öne al",
          detail: "Açık müşteri bakiyeleri aylık satış hacmine göre yüksek. Bugün tahsilat ekranı öncelikli olmalı.",
          href: "/panel/para",
        }
      : null,
    payableBalance > last30Sales * 0.5
      ? {
          title: "Ödeme planını dengele",
          detail: "Tedarikçi yükü artmış görünüyor. Vade sıralaması ve kasa/banka planı birlikte gözden geçirilmeli.",
          href: "/panel/alislar",
        }
      : null,
    openReminders > 0
      ? {
          title: "Geciken hatırlatmalar var",
          detail: `${openReminders} açık hatırlatma bekliyor. Aksiyon gecikmesi operasyon hızını düşürebilir.`,
          href: "/panel/bildirimler",
        }
      : null,
    {
      title: "Yeni satış fırsatı yarat",
      detail: "Teklif ve sipariş hattını canlı tutmak için bugün en az bir yeni satış kaydı veya teklif açmak faydalı olur.",
      href: "/panel/teklifler",
    },
  ].filter(Boolean) as Array<{ title: string; detail: string; href: string }>;

  return {
    insightCards,
    recommendations,
  };
}

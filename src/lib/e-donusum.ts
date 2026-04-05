export const eDonusumCategories = {
  gelenFaturalar: {
    key: 'gelenFaturalar',
    href: '/panel/e-donusum/gelen-faturalar',
    title: 'Gelen Faturalar',
    shortLabel: 'Gelen Fatura',
    subtitle: 'Hızlı Bilişim entegratöründen alınan gelen e-Fatura kayıtları burada listelenir.',
    appType: 1,
  },
  gidenFaturalar: {
    key: 'gidenFaturalar',
    href: '/panel/e-donusum/giden-faturalar',
    title: 'Giden Faturalar',
    shortLabel: 'Giden Fatura',
    subtitle: 'Gönderilmiş e-Fatura kayıtlarını durum ve zarf bilgisiyle burada izleyin.',
    appType: 2,
  },
  gidenEArsiv: {
    key: 'gidenEArsiv',
    href: '/panel/e-donusum/giden-e-arsiv',
    title: 'Giden e-Arşiv',
    shortLabel: 'Giden e-Arşiv',
    subtitle: 'e-Arşiv senaryolu giden belgeler Hızlı Bilişim servisinden çekilir.',
    appType: 3,
  },
  gelenIrsaliyeler: {
    key: 'gelenIrsaliyeler',
    href: '/panel/e-donusum/gelen-irsaliyeler',
    title: 'Gelen İrsaliyeler',
    shortLabel: 'Gelen İrsaliye',
    subtitle: 'Gelen e-İrsaliye kayıtlarını burada toplu olarak görebilirsiniz.',
    appType: 4,
  },
  gidenIrsaliyeler: {
    key: 'gidenIrsaliyeler',
    href: '/panel/e-donusum/giden-irsaliyeler',
    title: 'Giden İrsaliyeler',
    shortLabel: 'Giden İrsaliye',
    subtitle: 'Giden e-İrsaliye belgeleri Hızlı Bilişim servisinden okunur.',
    appType: 5,
  },
} as const;

export type EDonusumCategoryKey = keyof typeof eDonusumCategories;

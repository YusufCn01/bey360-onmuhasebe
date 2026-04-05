export type ModuleSummary = {
  slug: string;
  title: string;
  category: string;
  description: string;
  bullets: string[];
  badge: string;
};

export const moduleSummaries: ModuleSummary[] = [
  {
    slug: "e-fatura",
    title: "e-Fatura ve e-Arşiv",
    category: "e-Belge",
    description: "GİB uyumlu e-Arşiv ve e-Fatura akışlarını tek panelden yönetin.",
    bullets: [
      "e-Fatura kullanıcısı olmayanlar için ücretsiz GİB e-Arşiv",
      "Hızlı Bilişim e-Fatura entegrasyonu",
      "Tek tıkla gönderim ve durum takibi",
    ],
    badge: "Hazır",
  },
  {
    slug: "faturalar",
    title: "Alış ve Satış Faturaları",
    category: "Ticari İşlemler",
    description: "Alış, satış, iade ve siparişten otomatik fatura süreçlerini sade ekranlarla yönetin.",
    bullets: [
      "Siparişten otomatik fatura oluşturma",
      "Alış ve satış faturası düzenleme",
      "Tekliften siparişe, siparişten faturaya geçiş",
    ],
    badge: "Merkez",
  },
  {
    slug: "cari",
    title: "Borç ve Alacak Takibi",
    category: "Cari Hesap",
    description: "Cari kartlar, risk, vade, tahsilat ve ödeme hareketlerini tek yerde toplayın.",
    bullets: [
      "Borç ve alacak bakiyesi",
      "Tahsilat ve ödeme planları",
      "Müşteri ve tedarikçi hareket özeti",
    ],
    badge: "Canlı",
  },
  {
    slug: "stok",
    title: "Stok ve Ürün Takibi",
    category: "Envanter",
    description: "Stok, ürün, kritik seviye ve sayım takibini temiz bir çalışma düzeninde izleyin.",
    bullets: [
      "Stok giriş-çıkış ve sayım",
      "Ürün kartı, barkod ve birim yönetimi",
      "Kritik stok ve tedarik uyarıları",
    ],
    badge: "Canlı",
  },
  {
    slug: "tahsilat",
    title: "Tahsilat ve Ödeme Takibi",
    category: "Finans",
    description: "Nakit, havale, kredi kartı, online tahsilat ve ödeme akışlarını ilişkilendirin.",
    bullets: [
      "Tahsilat ve ödeme ekranları",
      "Online tahsilat entegrasyonu",
      "Cari ile bağlantılı ödeme hareketleri",
    ],
    badge: "Hazır",
  },
  {
    slug: "kasa-banka",
    title: "Kasa, Banka ve Çek",
    category: "Finans",
    description: "Kasa takibi, banka hesapları ve çek giriş-çıkış işlemlerini tek merkezde toplayın.",
    bullets: [
      "Kasa açılış-kapanış ve günlük hareketler",
      "17 banka için entegrasyon hazırlığı",
      "Çek giriş ve çıkış takibi",
    ],
    badge: "Hazır",
  },
  {
    slug: "pos",
    title: "Yeni Nesil POS",
    category: "Perakende",
    description: "İşbaşı POS benzeri hızlı satış mantığı için modern kasa altyapısını hazırlayın.",
    bullets: [
      "Kasiyer odaklı hızlı satış ekranı",
      "Cari satış ve fiş akışı altyapısı",
      "Mobil ve tablet uyumlu kullanım",
    ],
    badge: "Hazır",
  },
  {
    slug: "mobil",
    title: "Mobil ve Akıllı Otomasyonlar",
    category: "Mobilite",
    description: "Android, iOS, akıllı fiş okuma ve CRM bağlantılarını aynı ürün çatısında toplayın.",
    bullets: [
      "Ücretsiz Android ve iOS mobil kullanım",
      "Akıllı fiş okuma ile otomatik gider kaydı",
      "CRM ve e-Ticaret entegrasyonlarına hazır kurgu",
    ],
    badge: "Yol Haritası",
  },
];

export const dashboardCards = [
  { label: "Aylık Tahsilat", value: "₺ 842.500", detail: "Bu ay gerçekleşen tahsilatlar" },
  { label: "Kesilen Fatura", value: "1.248", detail: "e-Fatura + e-Arşiv toplamı" },
  { label: "Açık Cari Risk", value: "₺ 126.400", detail: "Takipteki borç ve vade riski" },
  { label: "Bekleyen Sipariş", value: "86", detail: "Faturalaşmayı bekleyen sipariş" },
];

export const workflowSteps = [
  {
    title: "Tekliften Siparişe",
    description: "CRM ve teklif akışından sipariş kartları otomatik oluşsun, onay süreci kaybolmasın.",
  },
  {
    title: "Siparişten Faturaya",
    description: "Onaylanan siparişi tek tıkla satış faturasına çevirin, stok ve cari aynı anda işlensin.",
  },
  {
    title: "Tahsilat ve Mutabakat",
    description: "Kasa, banka, online ödeme ve çek hareketleri faturayla ilişkili ilerlesin.",
  },
];

export const integrationHighlights = [
  "Ücretsiz GİB e-Arşiv akışı",
  "Hızlı Bilişim e-Fatura entegrasyonu",
  "17 banka ile banka entegrasyonu hazırlığı",
  "Pazaryeri ve e-Ticaret sipariş bağlantıları",
  "Online tahsilat entegrasyonu",
  "CRM süreçlerini tekliften tahsilata bağlama",
];

import type { ShellNavGroup } from "@/components/ui/app-shell";

export const tenantNavGroups: ShellNavGroup[] = [
  {
    title: "Aktif Modüller",
    items: [
      { href: "/panel", label: "Genel Bakış", icon: "home" },
      {
        label: "Satışlar",
        icon: "sales",
        children: [
          { href: "/panel/satislar", label: "Satış faturaları" },
          { href: "/panel/satis-faturalari/yeni", label: "Yeni satış faturası" },
          { href: "/panel/satis-faturalari/perakende-yeni", label: "Perakende satış faturası" },
          { href: "/panel/irsaliyeler", label: "Satış irsaliyeleri" },
          { href: "/panel/irsaliyeler/yeni", label: "Yeni satış irsaliyesi" },
          { href: "/panel/teklifler", label: "Teklifler" },
          { href: "/panel/teklif-siparis/teklif/yeni", label: "Yeni teklif" },
          { href: "/panel/siparisler", label: "Siparişler" },
          { href: "/panel/teklif-siparis/siparis/yeni", label: "Yeni sipariş" },
          { href: "/panel/iadeler/satis-yeni", label: "Yeni satış iadesi" },
        ],
      },
      {
        label: "Müşteriler",
        icon: "contact",
        children: [
          { href: "/panel/cari/musteriler", label: "Müşteri listesi" },
          { href: "/panel/cari/musteri/yeni", label: "Yeni müşteri" },
          { href: "/panel/cari/tedarikciler", label: "Tedarikçi listesi" },
          { href: "/panel/cari/tedarikci/yeni", label: "Yeni tedarikçi" },
        ],
      },
      {
        label: "Finans",
        icon: "wallet",
        children: [
          { href: "/panel/para", label: "Para hareketleri" },
          { href: "/panel/finans/tahsilat-odeme/yeni", label: "Yeni tahsilat / ödeme" },
          { href: "/panel/cek-senet", label: "Çek / senet" },
          { href: "/panel/cek-senet/yeni", label: "Yeni çek / senet" },
          { href: "/panel/para/kasalar", label: "Kasalar" },
          { href: "/panel/para/bankalar", label: "Bankalar" },
        ],
      },
      {
        label: "Stok",
        icon: "stock",
        children: [
          { href: "/panel/stok", label: "Ürün ve hizmetler" },
          { href: "/panel/stok/yeni", label: "Yeni ürün / hizmet" },
        ],
      },
      { href: "/panel/bildirimler", label: "Bildirimler", icon: "report" },
    ],
  },
  {
    title: "İşlemler",
    items: [
      {
        label: "Alışlar",
        icon: "purchase",
        children: [
          { href: "/panel/alislar", label: "Alış faturaları" },
          { href: "/panel/alis-faturalari/yeni", label: "Yeni alış faturası" },
          { href: "/panel/giderler", label: "Giderler" },
          { href: "/panel/iadeler/alis-yeni", label: "Yeni satın alma iadesi" },
        ],
      },
      { href: "/panel/iadeler", label: "İadeler", icon: "report" },
      {
        label: "Gider Yönetimi",
        icon: "expense",
        children: [
          { href: "/panel/giderler", label: "Gider listesi" },
          { href: "/panel/finans/gider/yeni", label: "Yeni gider kaydı" },
        ],
      },
      {
        label: "E-Dönüşüm",
        icon: "edonusum",
        children: [
          { href: "/panel/e-donusum", label: "Merkez" },
          { href: "/panel/e-donusum/mukellef-sorgu", label: "Mükellef sorgu" },
          { href: "/panel/e-donusum/gelen-faturalar", label: "Gelen faturalar" },
          { href: "/panel/e-donusum/giden-faturalar", label: "Giden faturalar" },
          { href: "/panel/e-donusum/giden-e-arsiv", label: "Giden e-Arşiv" },
          { href: "/panel/e-donusum/gelen-irsaliyeler", label: "Gelen irsaliyeler" },
          { href: "/panel/e-donusum/giden-irsaliyeler", label: "Giden irsaliyeler" },
        ],
      },
      { href: "/panel/raporlar", label: "Raporlar", icon: "report" },
      { href: "/panel/entegrasyonlar", label: "Entegrasyonlar", icon: "integrations" },
      { href: "/pos", label: "İşbaşı POS", icon: "pos", badge: "Yeni" },
    ],
  },
  {
    title: "Yönetim",
    items: [
      {
        label: "Firma ve Sistem",
        icon: "settings",
        children: [
          { href: "/panel/ayarlar/firma", label: "Firma bilgileri" },
          { href: "/panel/ayarlar/abonelik", label: "Abonelik ve paket" },
          { href: "/panel/ayarlar/subeler", label: "Şubeler" },
          { href: "/panel/ayarlar/e-fatura", label: "e-Fatura" },
          { href: "/panel/ayarlar/hizli-bilisim", label: "Hızlı Bilişim" },
          { href: "/panel/ayarlar/sablonlar/fatura", label: "Fatura şablonları" },
          { href: "/panel/ayarlar/sablonlar/irsaliye", label: "İrsaliye şablonları" },
          { href: "/panel/ayarlar/sablonlar/teklif", label: "Teklif şablonları" },
        ],
      },
    ],
  },
];

export const founderNavGroups: ShellNavGroup[] = [
  {
    title: "",
    items: [
      { href: "/kurucu", label: "Genel Bakış", icon: "home" },
      {
        label: "Yönetim",
        icon: "settings",
        children: [
          { href: "/kurucu/tenantlar", label: "Firma hesapları" },
          { href: "/kurucu/bayi-basvurulari", label: "Bayi başvuruları" },
          { href: "/kurucu/paketler", label: "Paket ve lisanslar" },
        ],
      },
    ],
  },
];

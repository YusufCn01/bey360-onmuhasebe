import type { ShellNavGroup } from "@/components/ui/app-shell";

export const tenantNavGroups: ShellNavGroup[] = [
  {
    title: "",
    items: [
      { href: "/panel", label: "Genel Bakış", icon: "home" },
      {
        label: "Satışlar",
        icon: "sales",
        children: [
          { href: "/panel/satislar", label: "Satış faturaları" },
          { href: "/panel/satis-faturalari/yeni", label: "Toptan satış faturası" },
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
        label: "Giderler",
        icon: "expense",
        children: [
          { href: "/panel/giderler", label: "Gider listesi" },
          { href: "/panel/finans/gider/yeni", label: "Yeni gider kaydı" },
        ],
      },
      {
        label: "Müşteri & Tedarikçi",
        icon: "contact",
        children: [
          { href: "/panel/cari/musteriler", label: "Müşteriler" },
          { href: "/panel/cari/tedarikciler", label: "Tedarikçiler" },
          { href: "/panel/cari/musteri/yeni", label: "Yeni müşteri" },
          { href: "/panel/cari/tedarikci/yeni", label: "Yeni tedarikçi" },
        ],
      },
      {
        label: "Stok & Hizmet",
        icon: "stock",
        children: [
          { href: "/panel/stok", label: "Ürün ve hizmetler" },
          { href: "/panel/stok/yeni", label: "Yeni ürün / hizmet" },
        ],
      },
      {
        label: "Para",
        icon: "wallet",
        children: [
          { href: "/panel/para", label: "Para hareketleri" },
          { href: "/panel/para/kasalar", label: "Kasalar" },
          { href: "/panel/para/bankalar", label: "Bankalar" },
          { href: "/panel/finans/tahsilat-odeme/yeni", label: "Yeni tahsilat / ödeme" },
          { href: "/panel/finans/kasa/yeni", label: "Yeni kasa" },
          { href: "/panel/finans/banka/yeni", label: "Yeni banka" },
          { href: "/panel/cek-senet", label: "Çek / senet" },
          { href: "/panel/cek-senet/yeni", label: "Yeni çek / senet" },
        ],
      },
      { href: "/panel/bildirimler", label: "Bildirimler", icon: "report" },
      {
        label: "E-Dönüşüm",
        icon: "edonusum",
        children: [
          { href: "/panel/e-donusum", label: "E-Dönüşüm Merkezi" },
          { href: "/panel/e-donusum/gelen-faturalar", label: "Gelen faturalar" },
          { href: "/panel/e-donusum/giden-faturalar", label: "Giden faturalar" },
          { href: "/panel/e-donusum/giden-e-arsiv", label: "Giden e-Arşiv" },
          { href: "/panel/e-donusum/gelen-irsaliyeler", label: "Gelen irsaliyeler" },
          { href: "/panel/e-donusum/giden-irsaliyeler", label: "Giden irsaliyeler" },
        ],
      },
      { href: "/panel/raporlar", label: "Raporlar", icon: "report" },
      {
        label: "Ayarlar",
        icon: "settings",
        children: [
          { href: "/panel/ayarlar/firma", label: "Firma bilgileri" },
          { href: "/panel/ayarlar/subeler", label: "Şubeler" },
          { href: "/panel/ayarlar/e-fatura", label: "e-Fatura" },
          { href: "/panel/ayarlar/hizli-bilisim", label: "Hızlı Bilişim" },
          { href: "/panel/ayarlar/sablonlar/fatura", label: "Fatura şablonları" },
          { href: "/panel/ayarlar/sablonlar/irsaliye", label: "İrsaliye şablonları" },
          { href: "/panel/ayarlar/sablonlar/teklif", label: "Teklif şablonları" },
        ],
      },
      { href: "/panel/entegrasyonlar", label: "Entegrasyonlar", icon: "integrations" },
      { href: "/pos", label: "İşbaşı POS", icon: "pos", badge: "Yeni" },
    ],
  },
];

export const founderNavGroups: ShellNavGroup[] = [
  {
    title: "Kurucu Paneli",
    items: [
      { href: "/kurucu", label: "Genel Bakış", icon: "home" },
      {
        label: "Yönetim",
        icon: "settings",
        children: [
          { href: "/kurucu/tenantlar", label: "Tenantlar" },
          { href: "/kurucu/bayi-basvurulari", label: "Bayi başvuruları" },
          { href: "/kurucu/paketler", label: "Paket ve lisanslar" },
        ],
      },
    ],
  },
];

export type TemplateBlockType = "header" | "company" | "recipient" | "document" | "items" | "totals" | "notes" | "signature";
export type TemplateBlockStyle = "boxed" | "plain" | "highlight";
export type TemplateKind = "INVOICE" | "DISPATCH" | "QUOTE";
export type ColumnKey = "code" | "name" | "quantity" | "unitPrice" | "lineTotal";
export type ColumnAlign = "left" | "center" | "right";

export type TemplateBlock = {
  id: string;
  type: TemplateBlockType;
  title: string;
  body: string;
  enabled: boolean;
  style: TemplateBlockStyle;
};

export type ColumnSetting = {
  label: string;
  width: number;
  align: ColumnAlign;
};

export type SignatureSettings = {
  leftLabel: string;
  rightLabel: string;
  note: string;
};

export type TemplateContent = {
  coverTitle: string;
  coverSubtitle: string;
  accent: string;
  logoUrl?: string;
  secondaryLogoUrl?: string;
  footerText?: string;
  itemColumns: ColumnKey[];
  columnSettings: Record<ColumnKey, ColumnSetting>;
  signatureSettings: SignatureSettings;
  blocks: TemplateBlock[];
};

export type TemplatePreset = {
  slug: string;
  name: string;
  description: string;
  content: TemplateContent;
};

export const templateKindMeta: Record<TemplateKind, { title: string; subtitle: string; shortLabel: string }> = {
  INVOICE: {
    title: "Fatura Şablonu",
    subtitle: "Satış ve alış faturalarında kullanılacak baskı düzenlerini yönetin.",
    shortLabel: "Fatura",
  },
  DISPATCH: {
    title: "İrsaliye Şablonu",
    subtitle: "Sevk ve teslim belgeleri için farklı düzenler oluşturun.",
    shortLabel: "İrsaliye",
  },
  QUOTE: {
    title: "Teklif Şablonu",
    subtitle: "Teklif çıktılarında kurumsal görünümü sürükle-bırak ile düzenleyin.",
    shortLabel: "Teklif",
  },
};

export const templateBlockCatalog: Array<{ type: TemplateBlockType; title: string; body: string }> = [
  { type: "header", title: "Kapak Başlığı", body: "Belgenin üst alanında kısa vurgu ve başlık görünür." },
  { type: "company", title: "Firma Bilgileri", body: "Logo, firma unvanı, vergi no ve iletişim bilgileri bu blokta yer alır." },
  { type: "recipient", title: "Alıcı Bilgileri", body: "Müşteri veya tedarikçi kartı bilgileri gösterilir." },
  { type: "document", title: "Belge Bilgileri", body: "Belge no, tarih, vade, para birimi ve sevk bilgileri listelenir." },
  { type: "items", title: "Kalem Tablosu", body: "Satır kalemleri, birim fiyatlar ve miktarlar bu bölümde yer alır." },
  { type: "totals", title: "Toplamlar", body: "Ara toplam, KDV kırılımı ve genel toplam özeti burada görünür." },
  { type: "notes", title: "Notlar", body: "Açıklama, teslim notu veya özel koşullar metni için kullanılır." },
  { type: "signature", title: "İmza Alanı", body: "Teslim eden, teslim alan veya onay imzası için ayrılan alan." },
];

const defaultColumnSettings: Record<ColumnKey, ColumnSetting> = {
  code: { label: "Kod", width: 16, align: "left" },
  name: { label: "Kalem", width: 34, align: "left" },
  quantity: { label: "Miktar", width: 12, align: "right" },
  unitPrice: { label: "Birim Fiyat", width: 18, align: "right" },
  lineTotal: { label: "Toplam", width: 20, align: "right" },
};

const defaultSignatureSettings: SignatureSettings = {
  leftLabel: "Onay / Teslim Eden",
  rightLabel: "Teslim Alan",
  note: "İmza alanlarını kurum ihtiyaçlarına göre düzenleyin.",
};

function createBlock(type: TemplateBlockType, index: number, style: TemplateBlockStyle = "boxed"): TemplateBlock {
  const meta = templateBlockCatalog.find((item) => item.type === type) ?? templateBlockCatalog[0];
  return {
    id: `${type}-${index + 1}`,
    type,
    title: meta.title,
    body: meta.body,
    enabled: true,
    style,
  };
}

function createTemplateContent(kind: TemplateKind, accent: string, order: TemplateBlockType[], coverTitle: string, coverSubtitle: string) {
  return {
    coverTitle,
    coverSubtitle,
    accent,
    logoUrl: "",
    secondaryLogoUrl: "",
    footerText: "Bu belge Bey360 üzerinden oluşturulmuştur.",
    itemColumns: ["code", "name", "quantity", "unitPrice", "lineTotal"],
    columnSettings: defaultColumnSettings,
    signatureSettings: defaultSignatureSettings,
    blocks: order.map((type, index) => createBlock(type, index, index === 0 ? "highlight" : index % 2 === 0 ? "boxed" : "plain")),
  } satisfies TemplateContent;
}

export function createBlockFromCatalog(type: TemplateBlockType, blocks: TemplateBlock[]) {
  return createBlock(type, blocks.length);
}

export function getTemplatePresets(kind: TemplateKind): TemplatePreset[] {
  const label = templateKindMeta[kind].shortLabel;

  return [
    {
      slug: "kurumsal-kirmizi",
      name: `${label} - Kurumsal Kırmızı`,
      description: "Logo İşbaşı mantığında güçlü başlık, net bloklar ve belirgin toplam alanı.",
      content: createTemplateContent(
        kind,
        "#d61f2c",
        ["header", "company", "recipient", "document", "items", "totals", "notes", "signature"],
        `${label} Çıktısı`,
        "Kurumsal görünüm, yüksek okunabilirlik ve resmi belge düzeni için hazırlandı.",
      ),
    },
    {
      slug: "sade-grid",
      name: `${label} - Sade Grid`,
      description: "Temiz çizgiler, daha az blok çerçevesi ve sakin kurumsal görünüm.",
      content: createTemplateContent(
        kind,
        "#0f172a",
        ["company", "document", "recipient", "items", "totals", "notes"],
        `${label} Düzeni`,
        "Kalabalığı azaltılmış, modern ve sade belge düzeni.",
      ),
    },
    {
      slug: "operasyon-odakli",
      name: `${label} - Operasyon`,
      description: "Sevk, teslim ve iç operasyon notlarını öne çıkaran düzen.",
      content: createTemplateContent(
        kind,
        "#0f766e",
        kind === "DISPATCH"
          ? ["header", "document", "company", "recipient", "items", "notes", "signature"]
          : ["header", "document", "company", "recipient", "items", "totals", "signature"],
        `${label} Operasyon Şablonu`,
        "Saha ekipleri ve operasyon çıktıları için pratik yerleşim.",
      ),
    },
  ];
}

function normalizeColumnSettings(raw?: Partial<Record<ColumnKey, Partial<ColumnSetting>>> | null) {
  return {
    code: {
      label: typeof raw?.code?.label === "string" && raw.code.label.trim() ? raw.code.label.trim() : defaultColumnSettings.code.label,
      width: Number.isFinite(raw?.code?.width) ? Number(raw?.code?.width) : defaultColumnSettings.code.width,
      align: raw?.code?.align === "center" || raw?.code?.align === "right" ? raw.code.align : defaultColumnSettings.code.align,
    },
    name: {
      label: typeof raw?.name?.label === "string" && raw.name.label.trim() ? raw.name.label.trim() : defaultColumnSettings.name.label,
      width: Number.isFinite(raw?.name?.width) ? Number(raw?.name?.width) : defaultColumnSettings.name.width,
      align: raw?.name?.align === "center" || raw?.name?.align === "right" ? raw.name.align : defaultColumnSettings.name.align,
    },
    quantity: {
      label: typeof raw?.quantity?.label === "string" && raw.quantity.label.trim() ? raw.quantity.label.trim() : defaultColumnSettings.quantity.label,
      width: Number.isFinite(raw?.quantity?.width) ? Number(raw?.quantity?.width) : defaultColumnSettings.quantity.width,
      align: raw?.quantity?.align === "left" || raw?.quantity?.align === "center" ? raw.quantity.align : defaultColumnSettings.quantity.align,
    },
    unitPrice: {
      label: typeof raw?.unitPrice?.label === "string" && raw.unitPrice.label.trim() ? raw.unitPrice.label.trim() : defaultColumnSettings.unitPrice.label,
      width: Number.isFinite(raw?.unitPrice?.width) ? Number(raw?.unitPrice?.width) : defaultColumnSettings.unitPrice.width,
      align: raw?.unitPrice?.align === "left" || raw?.unitPrice?.align === "center" ? raw.unitPrice.align : defaultColumnSettings.unitPrice.align,
    },
    lineTotal: {
      label: typeof raw?.lineTotal?.label === "string" && raw.lineTotal.label.trim() ? raw.lineTotal.label.trim() : defaultColumnSettings.lineTotal.label,
      width: Number.isFinite(raw?.lineTotal?.width) ? Number(raw?.lineTotal?.width) : defaultColumnSettings.lineTotal.width,
      align: raw?.lineTotal?.align === "left" || raw?.lineTotal?.align === "center" ? raw.lineTotal.align : defaultColumnSettings.lineTotal.align,
    },
  } satisfies Record<ColumnKey, ColumnSetting>;
}

export function normalizeTemplateContent(input: string | TemplateContent | null | undefined, kind: TemplateKind): TemplateContent {
  const fallback = getTemplatePresets(kind)[0]?.content;
  if (!fallback) {
    throw new Error("Varsayılan şablon bulunamadı.");
  }

  const raw = typeof input === "string" ? (JSON.parse(input) as Partial<TemplateContent>) : input;
  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const blocks = Array.isArray(raw.blocks)
    ? raw.blocks
        .filter((block): block is TemplateBlock => Boolean(block && typeof block === "object" && typeof block.type === "string"))
        .map((block, index) => ({
          id: typeof block.id === "string" && block.id ? block.id : `${block.type}-${index + 1}`,
          type: block.type,
          title: typeof block.title === "string" && block.title.trim() ? block.title.trim() : createBlock(block.type, index).title,
          body: typeof block.body === "string" ? block.body : "",
          enabled: block.enabled !== false,
          style: (block.style === "plain" || block.style === "highlight" ? block.style : "boxed") as TemplateBlockStyle,
        }))
    : fallback.blocks;

  const itemColumns = Array.isArray(raw.itemColumns)
    ? raw.itemColumns.filter(
        (column): column is ColumnKey => ["code", "name", "quantity", "unitPrice", "lineTotal"].includes(String(column)),
      )
    : fallback.itemColumns;

  const signatureSettings = {
    leftLabel:
      typeof raw.signatureSettings?.leftLabel === "string" && raw.signatureSettings.leftLabel.trim()
        ? raw.signatureSettings.leftLabel.trim()
        : defaultSignatureSettings.leftLabel,
    rightLabel:
      typeof raw.signatureSettings?.rightLabel === "string" && raw.signatureSettings.rightLabel.trim()
        ? raw.signatureSettings.rightLabel.trim()
        : defaultSignatureSettings.rightLabel,
    note:
      typeof raw.signatureSettings?.note === "string"
        ? raw.signatureSettings.note
        : defaultSignatureSettings.note,
  } satisfies SignatureSettings;

  return {
    coverTitle: typeof raw.coverTitle === "string" && raw.coverTitle.trim() ? raw.coverTitle.trim() : fallback.coverTitle,
    coverSubtitle: typeof raw.coverSubtitle === "string" && raw.coverSubtitle.trim() ? raw.coverSubtitle.trim() : fallback.coverSubtitle,
    accent: typeof raw.accent === "string" && raw.accent.trim() ? raw.accent.trim() : fallback.accent,
    logoUrl: typeof raw.logoUrl === "string" ? raw.logoUrl : fallback.logoUrl,
    secondaryLogoUrl: typeof raw.secondaryLogoUrl === "string" ? raw.secondaryLogoUrl : fallback.secondaryLogoUrl,
    footerText: typeof raw.footerText === "string" ? raw.footerText : fallback.footerText,
    itemColumns: itemColumns.length > 0 ? itemColumns : fallback.itemColumns,
    columnSettings: normalizeColumnSettings(raw.columnSettings),
    signatureSettings,
    blocks,
  };
}

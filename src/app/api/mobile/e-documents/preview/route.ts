import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDocumentFile, loginToHizliBilisim } from "@/lib/integrations/hizli-bilisim";
import { getMobileTenantContext } from "@/lib/mobile-session";

function firstMatch(xml: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = pattern.exec(xml);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function getSection(xml: string, tagName: string) {
  const match = new RegExp(`<cac:${tagName}>([\\s\\S]*?)</cac:${tagName}>`, "i").exec(xml);
  return match?.[1] ?? "";
}

function normalizeUnit(unitCode: string) {
  const normalized = unitCode.trim().toUpperCase();
  if (["NIU", "C62", "EA", "ADET"].includes(normalized)) return "Adet";
  if (["KGM", "KG"].includes(normalized)) return "Kg";
  if (["LTR", "LT"].includes(normalized)) return "Litre";
  if (["MTR", "M"].includes(normalized)) return "Metre";
  return "Adet";
}

function parseLineItems(xml: string) {
  const linePattern = /<cac:(?:InvoiceLine|DespatchLine)>([\s\S]*?)<\/cac:(?:InvoiceLine|DespatchLine)>/gi;
  const items: Array<{ description: string; quantity: number; unit: string; unitPrice: number; vatRate: number; lineTotal: number }> = [];

  for (const match of xml.matchAll(linePattern)) {
    const block = match[1];
    const itemSection = getSection(block, "Item");
    const taxSection = getSection(block, "ClassifiedTaxCategory");
    const quantityMatch = /<cbc:(?:InvoicedQuantity|DeliveredQuantity)([^>]*)>([\s\S]*?)<\/cbc:(?:InvoicedQuantity|DeliveredQuantity)>/i.exec(block);
    const quantity = Number(quantityMatch?.[2]?.trim() ?? "1") || 1;
    const unitCode = /unitCode="([^"]+)"/i.exec(quantityMatch?.[1] ?? "")?.[1] ?? "";

    items.push({
      description:
        decodeXml(
          firstMatch(itemSection || block, [
            /<cbc:Name>([\s\S]*?)<\/cbc:Name>/i,
            /<cbc:Description>([\s\S]*?)<\/cbc:Description>/i,
          ]),
        ) || "İçe aktarılan kalem",
      quantity,
      unit: normalizeUnit(unitCode),
      unitPrice: Number(firstMatch(block, [/<cac:Price>[\s\S]*?<cbc:PriceAmount[^>]*>([\s\S]*?)<\/cbc:PriceAmount>/i])) || 0,
      vatRate: Number(firstMatch(taxSection || block, [/<cbc:Percent>([\s\S]*?)<\/cbc:Percent>/i])) || 20,
      lineTotal: Number(firstMatch(block, [/<cbc:LineExtensionAmount[^>]*>([\s\S]*?)<\/cbc:LineExtensionAmount>/i])) || 0,
    });
  }

  return items;
}

function buildNotesFromXml(xml: string) {
  const documentId = firstMatch(xml, [/<cbc:ID>([\s\S]*?)<\/cbc:ID>/i]) || "-";
  const issueDate = firstMatch(xml, [/<cbc:IssueDate>([\s\S]*?)<\/cbc:IssueDate>/i]) || "-";
  const currencyCode = firstMatch(xml, [/<cbc:DocumentCurrencyCode>([\s\S]*?)<\/cbc:DocumentCurrencyCode>/i]) || "TRY";
  const payableAmount = Number(firstMatch(xml, [/<cac:LegalMonetaryTotal>[\s\S]*?<cbc:PayableAmount[^>]*>([\s\S]*?)<\/cbc:PayableAmount>/i])) || 0;
  const supplierName = decodeXml(firstMatch(getSection(xml, "AccountingSupplierParty"), [/<cac:PartyName>[\s\S]*?<cbc:Name>([\s\S]*?)<\/cbc:Name>/i])) || "-";
  const customerName = decodeXml(firstMatch(getSection(xml, "AccountingCustomerParty"), [/<cac:PartyName>[\s\S]*?<cbc:Name>([\s\S]*?)<\/cbc:Name>/i])) || "-";

  return [
    `Belge no: ${documentId}`,
    `Belge tarihi: ${issueDate}`,
    `Tedarikçi: ${supplierName}`,
    `Alıcı: ${customerName}`,
    `Toplam: ${new Intl.NumberFormat("tr-TR", { style: "currency", currency: currencyCode === "TRY" ? "TRY" : currencyCode, maximumFractionDigits: 2 }).format(payableAmount)}`,
  ];
}

export async function POST(request: NextRequest) {
  const context = await getMobileTenantContext(request);
  if (!context) {
    return NextResponse.json({ success: false, error: { message: "Mobil oturum geçersiz." } }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { folder?: string; documentId?: string; uuid?: string; appType?: number }
    | null;

  const folder = String(body?.folder ?? "outbox").trim().toLowerCase();
  const documentId = String(body?.documentId ?? "").trim();
  const uuid = String(body?.uuid ?? "").trim();
  const appType = Number(body?.appType ?? 0);

  if (folder === "drafts") {
    const document = await db.eInvoiceDocument.findFirst({
      where: { id: documentId, tenantId: context.tenant.id },
      include: { invoice: { include: { items: true, customer: true, supplier: true } } },
    });

    if (!document) {
      return NextResponse.json({ success: false, error: { message: "Taslak e-belge bulunamadı." } }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        notes: [
          `Belge no: ${document.invoice.invoiceNo}`,
          `Belge tarihi: ${document.invoice.issueDate.toISOString().slice(0, 10)}`,
          `Senaryo: ${document.scenario}`,
          `Durum: ${document.status}`,
        ],
        lineItems: document.invoice.items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unit: "Adet",
          unitPrice: Number(item.unitPrice),
          vatRate: Number(item.vatRate),
          lineTotal: Number(item.lineTotal),
        })),
      },
    });
  }

  if (!uuid || !appType) {
    return NextResponse.json({ success: false, error: { message: "UUID ve appType bilgileri zorunludur." } }, { status: 422 });
  }

  const settings = await db.eInvoiceSettings.findUnique({ where: { tenantId: context.tenant.id } });
  if (!settings) {
    return NextResponse.json({ success: false, error: { message: "Entegratör ayarları bulunamadı." } }, { status: 422 });
  }

  const login = await loginToHizliBilisim(settings);
  if (!login.success) {
    return NextResponse.json({ success: false, error: { message: login.note } }, { status: 502 });
  }

  const file = await getDocumentFile(settings, { appType, uuid, type: "XML", isDraft: false }, login);
  if (!file.success || !file.documentFile) {
    return NextResponse.json({ success: false, error: { message: file.note || "Belge XML'i alınamadı." } }, { status: 502 });
  }

  const xml = Buffer.from(file.documentFile, "base64").toString("utf8");

  return NextResponse.json({
    success: true,
    data: {
      notes: buildNotesFromXml(xml),
      lineItems: parseLineItems(xml),
    },
  });
}

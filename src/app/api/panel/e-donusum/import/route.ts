import { InvoiceDirection, InvoiceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getNextDocumentNumber } from "@/lib/business/documents";
import { db } from "@/lib/db";
import { getDocumentFile, loginToHizliBilisim } from "@/lib/integrations/hizli-bilisim";
import { getTenantRouteContext } from "@/lib/session-context";

type ParsedLineItem = {
  description: string;
  productCode: string;
  barcode: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  lineTotal: number;
};

type ParsedIncomingDocument = {
  supplierName: string;
  supplierTaxNumber: string;
  supplierPhone: string;
  supplierEmail: string;
  supplierCity: string;
  supplierAddress: string;
  customerName: string;
  documentId: string;
  issueDate: Date;
  payableAmount: number;
  taxTotal: number;
  subtotal: number;
  currencyCode: string;
  items: ParsedLineItem[];
};

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

function normalizeLookupValue(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR");
}

function buildProductKey(item: ParsedLineItem) {
  return [item.productCode || "-", item.barcode || "-", normalizeLookupValue(item.description)].join("::");
}

function parseLineItems(xml: string) {
  const linePattern = /<cac:(?:InvoiceLine|DespatchLine)>([\s\S]*?)<\/cac:(?:InvoiceLine|DespatchLine)>/gi;
  const items: ParsedLineItem[] = [];

  for (const match of xml.matchAll(linePattern)) {
    const block = match[1];
    const itemSection = getSection(block, "Item");
    const taxSection = getSection(block, "ClassifiedTaxCategory");
    const quantityMatch = /<cbc:(?:InvoicedQuantity|DeliveredQuantity)([^>]*)>([\s\S]*?)<\/cbc:(?:InvoicedQuantity|DeliveredQuantity)>/i.exec(block);
    const quantity = Number(quantityMatch?.[2]?.trim() ?? "1") || 1;
    const unitCode = /unitCode="([^"]+)"/i.exec(quantityMatch?.[1] ?? "")?.[1] ?? "";

    const description =
      decodeXml(
        firstMatch(itemSection || block, [
          /<cbc:Name>([\s\S]*?)<\/cbc:Name>/i,
          /<cbc:Description>([\s\S]*?)<\/cbc:Description>/i,
        ]),
      ) || "İçe aktarılan kalem";

    const productCode = decodeXml(
      firstMatch(itemSection || block, [
        /<cac:SellersItemIdentification>[\s\S]*?<cbc:ID[^>]*>([\s\S]*?)<\/cbc:ID>/i,
        /<cac:ManufacturersItemIdentification>[\s\S]*?<cbc:ID[^>]*>([\s\S]*?)<\/cbc:ID>/i,
        /<cac:BuyersItemIdentification>[\s\S]*?<cbc:ID[^>]*>([\s\S]*?)<\/cbc:ID>/i,
      ]),
    );

    const barcode = decodeXml(firstMatch(itemSection || block, [/<cac:StandardItemIdentification>[\s\S]*?<cbc:ID[^>]*>([\s\S]*?)<\/cbc:ID>/i]));
    const unitPrice = Number(firstMatch(block, [/<cac:Price>[\s\S]*?<cbc:PriceAmount[^>]*>([\s\S]*?)<\/cbc:PriceAmount>/i])) || 0;
    const vatRate = Number(firstMatch(taxSection || block, [/<cbc:Percent>([\s\S]*?)<\/cbc:Percent>/i])) || 20;
    const lineTotal = Number(firstMatch(block, [/<cbc:LineExtensionAmount[^>]*>([\s\S]*?)<\/cbc:LineExtensionAmount>/i])) || Number((quantity * unitPrice).toFixed(2));

    items.push({
      description,
      productCode,
      barcode,
      unit: normalizeUnit(unitCode),
      quantity,
      unitPrice,
      vatRate,
      lineTotal,
    });
  }

  return items;
}

function parseIncomingDocument(xml: string): ParsedIncomingDocument {
  const supplierSection = getSection(xml, "AccountingSupplierParty");
  const customerSection = getSection(xml, "AccountingCustomerParty");
  const supplierName = decodeXml(firstMatch(supplierSection, [/<cac:PartyName>[\s\S]*?<cbc:Name>([\s\S]*?)<\/cbc:Name>/i])) || "İçe aktarılan tedarikçi";
  const supplierTaxNumber = firstMatch(supplierSection, [/<cac:PartyIdentification>[\s\S]*?<cbc:ID[^>]*>([\s\S]*?)<\/cbc:ID>/i]);
  const supplierPhone = firstMatch(supplierSection, [/<cbc:Telephone>([\s\S]*?)<\/cbc:Telephone>/i]);
  const supplierEmail = firstMatch(supplierSection, [/<cbc:ElectronicMail>([\s\S]*?)<\/cbc:ElectronicMail>/i]);
  const supplierCity = decodeXml(firstMatch(supplierSection, [/<cbc:CityName>([\s\S]*?)<\/cbc:CityName>/i]));
  const supplierAddress = decodeXml(firstMatch(supplierSection, [/<cbc:StreetName>([\s\S]*?)<\/cbc:StreetName>/i]));
  const customerName = decodeXml(firstMatch(customerSection, [/<cac:PartyName>[\s\S]*?<cbc:Name>([\s\S]*?)<\/cbc:Name>/i]));
  const documentId = firstMatch(xml, [/<cbc:ID>([\s\S]*?)<\/cbc:ID>/i]);
  const issueDateRaw = firstMatch(xml, [/<cbc:IssueDate>([\s\S]*?)<\/cbc:IssueDate>/i]);
  const payableAmount = Number(firstMatch(xml, [/<cac:LegalMonetaryTotal>[\s\S]*?<cbc:PayableAmount[^>]*>([\s\S]*?)<\/cbc:PayableAmount>/i])) || 0;
  const taxTotal = Number(firstMatch(xml, [/<cac:TaxTotal>[\s\S]*?<cbc:TaxAmount[^>]*>([\s\S]*?)<\/cbc:TaxAmount>/i])) || 0;
  const subtotal = Number(firstMatch(xml, [/<cac:LegalMonetaryTotal>[\s\S]*?<cbc:LineExtensionAmount[^>]*>([\s\S]*?)<\/cbc:LineExtensionAmount>/i])) || Math.max(payableAmount - taxTotal, 0);
  const currencyCode = firstMatch(xml, [/<cbc:DocumentCurrencyCode>([\s\S]*?)<\/cbc:DocumentCurrencyCode>/i]) || "TRY";

  return {
    supplierName,
    supplierTaxNumber,
    supplierPhone,
    supplierEmail,
    supplierCity,
    supplierAddress,
    customerName,
    documentId,
    issueDate: issueDateRaw ? new Date(issueDateRaw) : new Date(),
    payableAmount,
    taxTotal,
    subtotal,
    currencyCode,
    items: parseLineItems(xml),
  };
}

async function findExistingSupplier(tenantId: string, parsed: ParsedIncomingDocument) {
  if (parsed.supplierTaxNumber) {
    const byTaxNumber = await db.supplier.findFirst({
      where: { tenantId, taxNumber: parsed.supplierTaxNumber },
    });
    if (byTaxNumber) return byTaxNumber;
  }

  const candidates = await db.supplier.findMany({
    where: {
      tenantId,
      OR: [
        { name: parsed.supplierName },
        ...(parsed.supplierEmail ? [{ email: parsed.supplierEmail }] : []),
        ...(parsed.supplierPhone ? [{ phone: parsed.supplierPhone }] : []),
      ],
    },
    take: 5,
  });

  return candidates.find((supplier) => normalizeLookupValue(supplier.name) === normalizeLookupValue(parsed.supplierName)) ?? candidates[0] ?? null;
}

async function findExistingProduct(tenantId: string, item: ParsedLineItem) {
  const candidates = await db.product.findMany({
    where: {
      tenantId,
      OR: [
        ...(item.productCode ? [{ code: item.productCode }] : []),
        ...(item.barcode ? [{ barcode: item.barcode }] : []),
        { name: item.description },
      ],
    },
    take: 10,
  });

  return (
    candidates.find((product) => item.productCode && product.code === item.productCode) ??
    candidates.find((product) => item.barcode && product.barcode === item.barcode) ??
    candidates.find((product) => normalizeLookupValue(product.name) === normalizeLookupValue(item.description)) ??
    null
  );
}

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        appType?: number;
        uuid?: string;
        documentId?: string;
        dryRun?: boolean;
        createMissingSupplier?: boolean;
        createMissingProducts?: boolean;
      }
    | null;

  const appType = Number(body?.appType || 0);
  const uuid = body?.uuid?.trim() || "";
  const remoteDocumentId = body?.documentId?.trim() || uuid;
  const dryRun = Boolean(body?.dryRun);
  const createMissingSupplier = Boolean(body?.createMissingSupplier);
  const createMissingProducts = Boolean(body?.createMissingProducts);

  if (!appType || !uuid) {
    return NextResponse.json({ success: false, error: "Belge bilgisi eksik." }, { status: 422 });
  }

  if (![1, 4].includes(appType)) {
    return NextResponse.json({ success: false, error: "Şimdilik sadece gelen faturalar ve gelen irsaliyeler içe alınabilir." }, { status: 422 });
  }

  const settings = await db.eInvoiceSettings.findUnique({ where: { tenantId: context.tenant.id } });
  if (!settings) {
    return NextResponse.json({ success: false, error: "Önce Hızlı Bilişim ayarlarını kaydetmelisiniz." }, { status: 422 });
  }

  const duplicate = await db.invoice.findFirst({
    where: {
      tenantId: context.tenant.id,
      direction: InvoiceDirection.PURCHASE,
      note: { contains: uuid },
    },
    select: { invoiceNo: true },
  });

  if (duplicate) {
    return NextResponse.json({ success: false, error: `Bu belge daha önce içe alınmış: ${duplicate.invoiceNo}` }, { status: 409 });
  }

  try {
    const login = await loginToHizliBilisim(settings);
    if (!login.success) {
      return NextResponse.json({ success: false, error: login.note }, { status: 502 });
    }

    const file = await getDocumentFile(settings, { appType, uuid, type: "XML" }, login);
    if (!file.success || !file.documentFile) {
      return NextResponse.json({ success: false, error: file.note || "Belge XML'i alınamadı." }, { status: 502 });
    }

    const xml = Buffer.from(file.documentFile, "base64").toString("utf8");
    const parsed = parseIncomingDocument(xml);
    const firstBranch = await db.branch.findFirst({ where: { tenantId: context.tenant.id }, orderBy: { createdAt: "asc" } });
    const existingSupplier = await findExistingSupplier(context.tenant.id, parsed);

    const productResolution = await Promise.all(
      parsed.items.map(async (item) => ({
        item,
        existingProduct: await findExistingProduct(context.tenant.id, item),
      })),
    );

    const missingProducts = Array.from(
      new Map(
        productResolution
          .filter((entry) => !entry.existingProduct)
          .map((entry) => [
            buildProductKey(entry.item),
            {
              code: entry.item.productCode || null,
              barcode: entry.item.barcode || null,
              name: entry.item.description,
              unit: entry.item.unit,
              unitPrice: entry.item.unitPrice,
              vatRate: entry.item.vatRate,
            },
          ]),
      ).values(),
    );

    const analysis = {
      supplier: {
        exists: Boolean(existingSupplier),
        name: parsed.supplierName,
        taxNumber: parsed.supplierTaxNumber || null,
        email: parsed.supplierEmail || null,
      },
      missingProducts,
      itemCount: parsed.items.length,
      canImportDirectly: Boolean(existingSupplier) && missingProducts.length === 0,
    };

    if (dryRun) {
      return NextResponse.json({ success: true, data: analysis });
    }

    if (!existingSupplier && !createMissingSupplier) {
      return NextResponse.json(
        {
          success: false,
          error: "Tedarikçi bulunamadı. İçe almadan önce tedarikçiyi oluşturmanız gerekiyor.",
          actionRequired: { missingSupplier: true, missingProducts },
          data: analysis,
        },
        { status: 409 },
      );
    }

    if (missingProducts.length > 0 && !createMissingProducts) {
      return NextResponse.json(
        {
          success: false,
          error: "Belgedeki bazı ürünler sistemde bulunamadı. İçe almadan önce ürünleri oluşturmanız gerekiyor.",
          actionRequired: { missingSupplier: !existingSupplier, missingProducts },
          data: analysis,
        },
        { status: 409 },
      );
    }

    const invoiceNo = await getNextDocumentNumber(context.tenant.id, "PURCHASE_INVOICE");

    const result = await db.$transaction(async (tx) => {
      let supplierId = existingSupplier?.id ?? null;
      let createdSupplier = false;
      let createdProducts = 0;
      const productMap = new Map<string, string>();
      let nextSupplierSequence = (await tx.supplier.count({ where: { tenantId: context.tenant.id } })) + 1;
      let nextProductSequence = (await tx.product.count({ where: { tenantId: context.tenant.id } })) + 1;

      if (!supplierId && createMissingSupplier) {
        const supplier = await tx.supplier.create({
          data: {
            tenantId: context.tenant.id,
            code: `TED-${String(nextSupplierSequence).padStart(5, "0")}`,
            name: parsed.supplierName,
            taxNumber: parsed.supplierTaxNumber || null,
            phone: parsed.supplierPhone || null,
            email: parsed.supplierEmail || null,
            city: parsed.supplierCity || null,
          },
        });
        nextSupplierSequence += 1;
        supplierId = supplier.id;
        createdSupplier = true;
      }

      for (const entry of productResolution) {
        const key = buildProductKey(entry.item);

        if (entry.existingProduct) {
          productMap.set(key, entry.existingProduct.id);
          continue;
        }

        if (productMap.has(key)) {
          continue;
        }

        const createdProduct = await tx.product.create({
          data: {
            tenantId: context.tenant.id,
            code: entry.item.productCode || `URN-${String(nextProductSequence).padStart(5, "0")}`,
            barcode: entry.item.barcode || null,
            name: entry.item.description,
            description: entry.item.description,
            unit: entry.item.unit,
            purchasePrice: Number(entry.item.unitPrice) || 0,
            salePrice: Number(entry.item.unitPrice) || 0,
            vatRate: Number(entry.item.vatRate) || 20,
          },
        });
        nextProductSequence += 1;
        createdProducts += 1;
        productMap.set(key, createdProduct.id);
      }

      const invoiceItems = (parsed.items.length
        ? parsed.items
        : [
            {
              description: parsed.documentId || remoteDocumentId,
              productCode: "",
              barcode: "",
              unit: "Adet",
              quantity: 1,
              unitPrice: parsed.subtotal,
              vatRate: parsed.subtotal > 0 ? Number(((parsed.taxTotal / Math.max(parsed.subtotal, 1)) * 100).toFixed(2)) : 20,
              lineTotal: parsed.subtotal,
            },
          ]) as ParsedLineItem[];

      const invoice = await tx.invoice.create({
        data: {
          tenantId: context.tenant.id,
          branchId: firstBranch?.id ?? null,
          supplierId,
          invoiceNo,
          direction: InvoiceDirection.PURCHASE,
          status: InvoiceStatus.DRAFT,
          issueDate: parsed.issueDate,
          currencyCode: parsed.currencyCode || "TRY",
          subtotal: parsed.subtotal,
          vatTotal: parsed.taxTotal,
          grandTotal: parsed.payableAmount || parsed.subtotal + parsed.taxTotal,
          paidTotal: 0,
          note: `Hızlı Bilişim içe alımı · Belge: ${parsed.documentId || remoteDocumentId} · UUID: ${uuid} · Alıcı: ${parsed.customerName || "-"}${parsed.supplierAddress ? ` · Adres: ${parsed.supplierAddress}` : ""}`,
          items: {
            create: invoiceItems.map((item) => ({
              productId: productMap.get(buildProductKey(item)) ?? null,
              description: item.description,
              quantity: Number(item.quantity) || 1,
              unitPrice: Number(item.unitPrice) || 0,
              vatRate: Number(item.vatRate) || 0,
              lineTotal: Number(item.lineTotal) || 0,
            })),
          },
        },
        include: { supplier: true, items: true },
      });

      return { invoice, createdSupplier, createdProducts };
    });

    revalidatePath("/panel/alislar");
    revalidatePath("/panel/alis-faturalari");
    revalidatePath("/panel/alis-faturalari/yeni");
    revalidatePath("/panel/cari/tedarikciler");
    revalidatePath("/panel/stok");
    revalidatePath("/panel/e-donusum/gelen-faturalar");
    revalidatePath("/panel/e-donusum/gelen-irsaliyeler");

    return NextResponse.json({
      success: true,
      data: {
        invoiceId: result.invoice.id,
        invoiceNo: result.invoice.invoiceNo,
        supplier: result.invoice.supplier?.name ?? parsed.supplierName,
        createdSupplier: result.createdSupplier,
        createdProducts: result.createdProducts,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Belge içe alınamadı.";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}

import { CustomerType, EInvoiceDocumentStatus, EInvoiceScenario, InvoiceDirection, InvoiceStatus, SalesInvoiceKind } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getNextDocumentNumber } from "@/lib/business/documents";
import { db } from "@/lib/db";
import { buildPreliminaryUblXml } from "@/lib/einvoice-ubl";
import { sendInvoiceToHizliBilisim } from "@/lib/integrations/hizli-bilisim";
import { getTenantRouteContext } from "@/lib/session-context";

export async function POST() {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const settings = await db.eInvoiceSettings.findUnique({ where: { tenantId: context.tenant.id } });
  if (!settings || settings.provider !== "HIZLI_BILISIM") {
    return NextResponse.json({ success: false, error: "Önce Hızlı Bilişim sağlayıcısını aktif etmelisiniz." }, { status: 422 });
  }

  const branch = context.membership.branchId
    ? await db.branch.findFirst({ where: { id: context.membership.branchId, tenantId: context.tenant.id } })
    : await db.branch.findFirst({ where: { tenantId: context.tenant.id }, orderBy: { createdAt: "asc" } });

  const productCode = "HB-TEST-URUN";
  const customerCode = "HB-ARSIV-TEST";
  const issueAt = new Date();
  const invoiceNo = await getNextDocumentNumber(context.tenant.id, "SALES_INVOICE");

  const product = await db.product.upsert({
    where: { tenantId_code: { tenantId: context.tenant.id, code: productCode } },
    update: {
      name: "Hızlı Bilişim Test Ürünü",
      salePrice: 100,
      purchasePrice: 75,
      vatRate: 20,
      unit: "Adet",
      description: "Hızlı Bilişim örnek e-Arşiv gönderim ürünü",
      category: "Demo",
      brand: "Bey360",
    },
    create: {
      tenantId: context.tenant.id,
      code: productCode,
      name: "Hızlı Bilişim Test Ürünü",
      salePrice: 100,
      purchasePrice: 75,
      vatRate: 20,
      unit: "Adet",
      description: "Hızlı Bilişim örnek e-Arşiv gönderim ürünü",
      category: "Demo",
      brand: "Bey360",
      stockQty: 999,
    },
  });

  const customer = await db.customer.upsert({
    where: { tenantId_code: { tenantId: context.tenant.id, code: customerCode } },
    update: {
      type: CustomerType.INDIVIDUAL,
      name: "Muhtelif Müşteriler",
      title: "Muhtelif Müşteriler",
      firstName: "Muhtelif",
      lastName: "Müşteriler",
      taxNumber: "11111111111",
      city: context.tenant.city,
      district: context.tenant.district,
      address: context.tenant.address,
      country: "Türkiye",
      email: context.tenant.email,
      phone: context.tenant.phone,
    },
    create: {
      tenantId: context.tenant.id,
      code: customerCode,
      type: CustomerType.INDIVIDUAL,
      name: "Muhtelif Müşteriler",
      title: "Muhtelif Müşteriler",
      firstName: "Muhtelif",
      lastName: "Müşteriler",
      taxNumber: "11111111111",
      city: context.tenant.city,
      district: context.tenant.district,
      address: context.tenant.address,
      country: "Türkiye",
      email: context.tenant.email,
      phone: context.tenant.phone,
      currencyCode: "TRY",
    },
  });

  const subtotal = 100;
  const vatTotal = 20;
  const grandTotal = 120;

  const invoice = await db.invoice.create({
    data: {
      tenantId: context.tenant.id,
      branchId: branch?.id ?? null,
      customerId: customer.id,
      invoiceNo,
      direction: InvoiceDirection.SALES,
      salesInvoiceKind: SalesInvoiceKind.RETAIL,
      status: InvoiceStatus.ISSUED,
      issueDate: issueAt,
      dueDate: issueAt,
      currencyCode: "TRY",
      subtotal,
      vatTotal,
      grandTotal,
      paidTotal: 0,
      note: "Hızlı Bilişim örnek e-Arşiv gönderim testi",
      items: {
        create: [
          {
            productId: product.id,
            description: product.name,
            quantity: 1,
            unitPrice: subtotal,
            vatRate: product.vatRate,
            lineTotal: grandTotal,
          },
        ],
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      customer: true,
      supplier: true,
      branch: true,
    },
  });

  const document = await db.eInvoiceDocument.create({
    data: {
      tenantId: context.tenant.id,
      invoiceId: invoice.id,
      provider: settings.provider,
      scenario: EInvoiceScenario.E_ARCHIVE,
      status: EInvoiceDocumentStatus.READY,
      envelopeUuid: crypto.randomUUID(),
      responseNote: "Örnek e-Arşiv gönderim testi hazırlandı",
    },
  });

  try {
    const xmlContent = buildPreliminaryUblXml({
      tenant: context.tenant,
      settings,
      document,
      invoice,
    });

    const result = await sendInvoiceToHizliBilisim({
      tenant: context.tenant,
      settings,
      document,
      invoice,
      xmlContent,
    });

    const updated = await db.eInvoiceDocument.update({
      where: { id: document.id },
      data: {
        status: result.success ? EInvoiceDocumentStatus.SENT : EInvoiceDocumentStatus.FAILED,
        externalId: result.externalId ?? document.externalId,
        envelopeUuid: result.envelopeUuid ?? document.envelopeUuid,
        sourceUrn: result.sourceUrn ?? document.sourceUrn,
        destinationUrn: result.destinationUrn ?? document.destinationUrn,
        responseNote: result.note,
      },
    });

    revalidatePath("/panel/ayarlar/hizli-bilisim");
    revalidatePath("/panel/ayarlar/e-fatura");
    revalidatePath("/panel/faturalar");

    return result.success
      ? NextResponse.json({
          success: true,
          data: {
            invoiceId: invoice.id,
            invoiceNo: invoice.invoiceNo,
            documentId: updated.id,
            note: result.note,
          },
        })
      : NextResponse.json(
          {
            success: false,
            error: result.note,
            data: {
              invoiceId: invoice.id,
              invoiceNo: invoice.invoiceNo,
              documentId: updated.id,
            },
          },
          { status: 502 },
        );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Örnek belge gönderilemedi.";

    await db.eInvoiceDocument.update({
      where: { id: document.id },
      data: {
        status: EInvoiceDocumentStatus.FAILED,
        responseNote: message,
      },
    });

    revalidatePath("/panel/ayarlar/hizli-bilisim");
    revalidatePath("/panel/ayarlar/e-fatura");
    revalidatePath("/panel/faturalar");

    return NextResponse.json(
      {
        success: false,
        error: message,
        data: {
          invoiceId: invoice.id,
          invoiceNo: invoice.invoiceNo,
          documentId: document.id,
        },
      },
      { status: 502 },
    );
  }
}

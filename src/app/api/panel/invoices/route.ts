import { revalidatePath } from "next/cache";
import { InvoiceDirection, InvoiceStatus, SalesInvoiceKind } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ensureEInvoiceDraft } from "@/lib/business/einvoice";
import { getNextDocumentNumber } from "@/lib/business/documents";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

type InvoiceItemInput = {
  productId?: string | null;
  quantity?: string | number;
  unitPrice?: string | number;
  vatRate?: string | number;
  withholdingRate?: string | number;
};

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        direction?: InvoiceDirection;
        invoiceNo?: string;
        customerId?: string | null;
        supplierId?: string | null;
        items?: InvoiceItemInput[];
        issueDate?: string;
        deliveryDate?: string;
        dueDate?: string;
        currencyCode?: string;
        salesInvoiceKind?: SalesInvoiceKind | null;
        note?: string;
      }
    | null;

  const direction = body?.direction === InvoiceDirection.PURCHASE ? InvoiceDirection.PURCHASE : InvoiceDirection.SALES;
  const items = Array.isArray(body?.items) ? body.items : [];

  if (items.length === 0) {
    return NextResponse.json({ success: false, error: "Fatura için en az bir kalem eklemelisiniz." }, { status: 422 });
  }

  if (direction === InvoiceDirection.SALES && !body?.customerId) {
    return NextResponse.json({ success: false, error: "Satış faturası için müşteri seçmelisiniz." }, { status: 422 });
  }

  if (direction === InvoiceDirection.PURCHASE && !body?.supplierId) {
    return NextResponse.json({ success: false, error: "Alış faturası için tedarikçi seçmelisiniz." }, { status: 422 });
  }

  const productIds = [...new Set(items.map((item) => item.productId).filter(Boolean) as string[])];
  const products = await db.product.findMany({ where: { tenantId: context.tenant.id, id: { in: productIds } } });
  const productMap = new Map(products.map((product) => [product.id, product]));

  const normalizedItems = items.map((item, index) => {
    const productId = item.productId?.trim();
    const product = productId ? productMap.get(productId) : null;
    if (!product) {
      throw new Error(`Kalem #${index + 1} için geçerli bir ürün seçmelisiniz.`);
    }

    const quantity = Number(item.quantity ?? 0);
    const unitPrice = Number(item.unitPrice ?? 0);
    const vatRate = Number(item.vatRate ?? 0);
    const withholdingRate = Number(item.withholdingRate ?? product.withholdingRate ?? 0);
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isFinite(vatRate) || vatRate < 0) {
      throw new Error(`Kalem #${index + 1} için miktar, fiyat ve KDV bilgileri geçerli olmalıdır.`);
    }

    const subtotal = quantity * unitPrice;
    const vatTotal = subtotal * (vatRate / 100);
    const effectiveWithholdingRate = product.kind === "SERVICE" && direction === InvoiceDirection.SALES ? withholdingRate : 0;
    const withholdingAmount = subtotal * (effectiveWithholdingRate / 100);
    return {
      productId: product.id,
      description: product.name,
      quantity,
      unitPrice,
      vatRate,
      withholdingRate: effectiveWithholdingRate,
      withholdingAmount,
      subtotal,
      vatTotal,
      lineTotal: subtotal + vatTotal,
    };
  });

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const vatTotal = normalizedItems.reduce((sum, item) => sum + item.vatTotal, 0);
  const withholdingTotal = normalizedItems.reduce((sum, item) => sum + item.withholdingAmount, 0);
  const grandTotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);

  const invoiceNo = body?.invoiceNo?.trim() || (await getNextDocumentNumber(context.tenant.id, direction === InvoiceDirection.SALES ? "SALES_INVOICE" : "PURCHASE_INVOICE"));

  try {
    const invoice = await db.invoice.create({
      data: {
        tenantId: context.tenant.id,
        branchId: context.membership.branchId,
        customerId: direction === InvoiceDirection.SALES ? body?.customerId ?? null : null,
        supplierId: direction === InvoiceDirection.PURCHASE ? body?.supplierId ?? null : null,
        invoiceNo,
        direction,
        status: InvoiceStatus.ISSUED,
        issueDate: body?.issueDate ? new Date(body.issueDate) : new Date(),
        deliveryDate: body?.deliveryDate ? new Date(body.deliveryDate) : null,
        dueDate: body?.dueDate ? new Date(body.dueDate) : null,
        currencyCode: body?.currencyCode?.trim() || "TRY",
        salesInvoiceKind: direction === InvoiceDirection.SALES ? body?.salesInvoiceKind ?? SalesInvoiceKind.WHOLESALE : null,
        subtotal,
        vatTotal,
        withholdingTotal,
        grandTotal,
        paidTotal: 0,
        note: body?.note?.trim() || null,
        items: {
          create: normalizedItems.map((item) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            withholdingRate: item.withholdingRate,
            withholdingAmount: item.withholdingAmount,
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: { items: true },
    });

    if (direction === InvoiceDirection.SALES && body?.customerId) {
      await db.customer.update({
        where: { id: body.customerId },
        data: { currentDebt: { increment: grandTotal } },
      });
      const eInvoiceDocument = await ensureEInvoiceDraft(invoice.id, context.tenant.id);
      const nextInvoiceNo = await getNextDocumentNumber(context.tenant.id, direction === InvoiceDirection.SALES ? "SALES_INVOICE" : "PURCHASE_INVOICE");

      revalidatePath("/panel/faturalar");
      revalidatePath("/panel");
      revalidatePath("/panel/cari");
      revalidatePath("/panel/ayarlar/e-fatura");

      return NextResponse.json({ success: true, data: { invoice, nextInvoiceNo, eInvoiceDocumentId: eInvoiceDocument?.id ?? null } });
    }

    if (direction === InvoiceDirection.PURCHASE && body?.supplierId) {
      await db.payment.create({
        data: {
          tenantId: context.tenant.id,
          invoiceId: invoice.id,
          direction: "OUT",
          method: "BANK",
          amount: 0,
          description: "Alış faturası oluşturuldu",
        },
      });
    }

    revalidatePath("/panel/faturalar");
    revalidatePath("/panel");
    revalidatePath("/panel/cari");
    revalidatePath("/panel/ayarlar/e-fatura");

    const nextInvoiceNo = await getNextDocumentNumber(context.tenant.id, direction === InvoiceDirection.SALES ? "SALES_INVOICE" : "PURCHASE_INVOICE");
    return NextResponse.json({ success: true, data: { invoice, nextInvoiceNo, eInvoiceDocumentId: null } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fatura oluşturulamadı.";
    return NextResponse.json({ success: false, error: message }, { status: 422 });
  }
}

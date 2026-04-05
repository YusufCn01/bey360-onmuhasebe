import { revalidatePath } from "next/cache";
import { InvoiceStatus, SalesInvoiceKind } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

type InvoiceItemInput = {
  productId?: string | null;
  quantity?: string | number;
  unitPrice?: string | number;
  vatRate?: string | number;
};

const allowedStatuses = new Set<InvoiceStatus>(["DRAFT", "ISSUED", "PARTIAL", "PAID", "CANCELLED"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const { invoiceId } = await params;
  const body = (await request.json().catch(() => null)) as
    | {
        status?: InvoiceStatus;
        deliveryDate?: string;
        dueDate?: string;
        currencyCode?: string;
        salesInvoiceKind?: SalesInvoiceKind | null;
        note?: string;
        items?: InvoiceItemInput[];
      }
    | null;

  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, tenantId: context.tenant.id },
    include: { items: true, payments: true },
  });
  if (!invoice) {
    return NextResponse.json({ success: false, error: "Fatura bulunamadı." }, { status: 404 });
  }

  const status = body?.status && allowedStatuses.has(body.status) ? body.status : invoice.status;
  const deliveryDate = body?.deliveryDate?.trim() ? new Date(body.deliveryDate) : null;
  const dueDate = body?.dueDate?.trim() ? new Date(body.dueDate) : null;
  if (body?.deliveryDate?.trim() && Number.isNaN(deliveryDate?.getTime())) {
    return NextResponse.json({ success: false, error: "Sevk tarihi geçerli değil." }, { status: 422 });
  }
  if (body?.dueDate?.trim() && Number.isNaN(dueDate?.getTime())) {
    return NextResponse.json({ success: false, error: "Vade tarihi geçerli değil." }, { status: 422 });
  }

  const items = Array.isArray(body?.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ success: false, error: "Fatura için en az bir kalem olmalıdır." }, { status: 422 });
  }

  if (invoice.payments.some((payment) => Number(payment.amount) > 0)) {
    return NextResponse.json({ success: false, error: "Tahsilat veya ödeme alınmış faturaların kalemleri değiştirilemez." }, { status: 409 });
  }

  const productIds = [...new Set(items.map((item) => item.productId).filter(Boolean) as string[])];
  const products = await db.product.findMany({ where: { tenantId: context.tenant.id, id: { in: productIds } } });
  const productMap = new Map(products.map((product) => [product.id, product]));

  try {
    const normalizedItems = items.map((item, index) => {
      const productId = item.productId?.trim();
      const product = productId ? productMap.get(productId) : null;
      if (!product) {
        throw new Error(`Kalem #${index + 1} için geçerli bir ürün seçmelisiniz.`);
      }

      const quantity = Number(item.quantity ?? 0);
      const unitPrice = Number(item.unitPrice ?? 0);
      const vatRate = Number(item.vatRate ?? 0);
      if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isFinite(vatRate) || vatRate < 0) {
        throw new Error(`Kalem #${index + 1} için miktar, fiyat ve KDV bilgileri geçerli olmalıdır.`);
      }

      const subtotal = quantity * unitPrice;
      const vatTotal = subtotal * (vatRate / 100);
      return {
        productId: product.id,
        description: product.name,
        quantity,
        unitPrice,
        vatRate,
        subtotal,
        vatTotal,
        lineTotal: subtotal + vatTotal,
      };
    });

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const vatTotal = normalizedItems.reduce((sum, item) => sum + item.vatTotal, 0);
    const grandTotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const debtDelta = grandTotal - Number(invoice.grandTotal);

    const updatedInvoice = await db.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } });

      if (invoice.direction === "SALES" && invoice.customerId && debtDelta !== 0) {
        await tx.customer.update({
          where: { id: invoice.customerId },
          data: { currentDebt: { increment: debtDelta } },
        });
      }

      return tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status,
          deliveryDate,
          dueDate,
          currencyCode: body?.currencyCode?.trim() || invoice.currencyCode,
          salesInvoiceKind: invoice.direction === "SALES" ? body?.salesInvoiceKind ?? invoice.salesInvoiceKind ?? SalesInvoiceKind.WHOLESALE : null,
          note: body?.note?.trim() || null,
          subtotal,
          vatTotal,
          grandTotal,
          items: {
            create: normalizedItems.map((item) => ({
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              vatRate: item.vatRate,
              lineTotal: item.lineTotal,
            })),
          },
        },
      });
    });

    revalidatePath("/panel/faturalar");
    revalidatePath("/panel/finans");
    revalidatePath("/panel/cari");
    revalidatePath("/panel");

    return NextResponse.json({ success: true, data: updatedInvoice });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fatura güncellenemedi.";
    return NextResponse.json({ success: false, error: message }, { status: 422 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const { invoiceId } = await params;
  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, tenantId: context.tenant.id },
    include: { payments: true },
  });

  if (!invoice) {
    return NextResponse.json({ success: false, error: "Fatura bulunamadı." }, { status: 404 });
  }

  if (invoice.payments.some((payment) => Number(payment.amount) > 0)) {
    return NextResponse.json({ success: false, error: "Tahsilat veya ödeme alınmış faturalar silinemez." }, { status: 409 });
  }

  await db.$transaction(async (tx) => {
    await tx.payment.deleteMany({ where: { invoiceId: invoice.id } });

    if (invoice.direction === "SALES" && invoice.customerId) {
      await tx.customer.update({
        where: { id: invoice.customerId },
        data: { currentDebt: { decrement: Number(invoice.grandTotal) } },
      });
    }

    await tx.invoice.delete({ where: { id: invoice.id } });
  });

  revalidatePath("/panel/faturalar");
  revalidatePath("/panel/finans");
  revalidatePath("/panel/cari");
  revalidatePath("/panel");

  return NextResponse.json({ success: true });
}

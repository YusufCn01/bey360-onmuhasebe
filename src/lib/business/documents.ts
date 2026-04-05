import { InvoiceDirection, InvoiceStatus, OrderStatus, QuoteStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { ensureEInvoiceDraft } from "@/lib/business/einvoice";

export async function getNextDocumentNumber(
  tenantId: string,
  type: "QUOTE" | "ORDER" | "SALES_INVOICE" | "PURCHASE_INVOICE" | "SALES_DISPATCH" | "SALES_RETURN" | "PURCHASE_RETURN",
) {
  const map = {
    QUOTE: { prefix: "TKL", count: () => db.quote.count({ where: { tenantId } }) },
    ORDER: { prefix: "SIP", count: () => db.salesOrder.count({ where: { tenantId } }) },
    SALES_INVOICE: { prefix: "SAT", count: () => db.invoice.count({ where: { tenantId, direction: InvoiceDirection.SALES } }) },
    PURCHASE_INVOICE: { prefix: "ALI", count: () => db.invoice.count({ where: { tenantId, direction: InvoiceDirection.PURCHASE } }) },
    SALES_DISPATCH: { prefix: "IRS", count: () => db.dispatchNote.count({ where: { tenantId, direction: "SALES" } }) },
    SALES_RETURN: { prefix: "SIA", count: () => db.returnDocument.count({ where: { tenantId, direction: "SALES" } }) },
    PURCHASE_RETURN: { prefix: "AIA", count: () => db.returnDocument.count({ where: { tenantId, direction: "PURCHASE" } }) },
  } as const;

  const entry = map[type];
  const count = await entry.count();
  return `${entry.prefix}-${String(count + 1).padStart(5, "0")}`;
}

export function calculateTotals(quantity: number, unitPrice: number, vatRate: number) {
  const subtotal = quantity * unitPrice;
  const vatTotal = subtotal * (vatRate / 100);
  const grandTotal = subtotal + vatTotal;
  return { subtotal, vatTotal, grandTotal };
}

export async function createInvoiceFromOrder(orderId: string, tenantId: string, branchId?: string | null) {
  const order = await db.salesOrder.findFirst({
    where: { id: orderId, tenantId },
    include: { items: true },
  });

  if (!order) {
    throw new Error("Sipariş bulunamadı.");
  }

  if (order.status === OrderStatus.INVOICED) {
    throw new Error("Bu sipariş zaten faturalanmış.");
  }

  const invoiceNo = await getNextDocumentNumber(tenantId, "SALES_INVOICE");

  const invoice = await db.invoice.create({
    data: {
      tenantId,
      branchId: branchId ?? order.branchId,
      customerId: order.customerId,
      orderId: order.id,
      invoiceNo,
      direction: InvoiceDirection.SALES,
      status: InvoiceStatus.ISSUED,
      issueDate: new Date(),
      subtotal: Number(order.subtotal),
      vatTotal: Number(order.vatTotal),
      grandTotal: Number(order.grandTotal),
      paidTotal: 0,
      note: `Siparişten otomatik oluşturuldu: ${order.orderNo}`,
      items: {
        create: order.items.map((item) => ({
          productId: item.productId,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          vatRate: Number(item.vatRate),
          lineTotal: Number(item.lineTotal),
        })),
      },
    },
  });

  await db.salesOrder.update({
    where: { id: order.id },
    data: { status: OrderStatus.INVOICED },
  });

  if (order.customerId) {
    await db.customer.update({
      where: { id: order.customerId },
      data: { currentDebt: { increment: Number(order.grandTotal) } },
    });
  }

  await ensureEInvoiceDraft(invoice.id, tenantId);

  return invoice;
}

export async function createOrderFromQuote(quoteId: string, tenantId: string, branchId?: string | null) {
  const quote = await db.quote.findFirst({
    where: { id: quoteId, tenantId },
    include: { items: true },
  });

  if (!quote) {
    throw new Error("Teklif bulunamadı.");
  }

  const orderNo = await getNextDocumentNumber(tenantId, "ORDER");

  const order = await db.salesOrder.create({
    data: {
      tenantId,
      branchId: branchId ?? quote.branchId,
      customerId: quote.customerId,
      orderNo,
      status: OrderStatus.APPROVED,
      issueDate: new Date(),
      subtotal: Number(quote.subtotal),
      vatTotal: Number(quote.vatTotal),
      grandTotal: Number(quote.grandTotal),
      note: `Tekliften dönüştürüldü: ${quote.quoteNo}`,
      items: {
        create: quote.items.map((item) => ({
          productId: item.productId,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          vatRate: Number(item.vatRate),
          lineTotal: Number(item.lineTotal),
        })),
      },
    },
  });

  await db.quote.update({
    where: { id: quote.id },
    data: { status: QuoteStatus.APPROVED },
  });

  return order;
}

export async function createInvoiceFromDispatchNote(dispatchNoteId: string, tenantId: string, branchId?: string | null) {
  const dispatchNote = await db.dispatchNote.findFirst({
    where: { id: dispatchNoteId, tenantId, direction: "SALES" },
    include: { items: true },
  });

  if (!dispatchNote) {
    throw new Error("İrsaliye bulunamadı.");
  }

  if (dispatchNote.status === "INVOICED") {
    throw new Error("Bu irsaliye zaten faturalanmış.");
  }

  const invoiceNo = await getNextDocumentNumber(tenantId, "SALES_INVOICE");

  const invoice = await db.invoice.create({
    data: {
      tenantId,
      branchId: branchId ?? dispatchNote.branchId,
      customerId: dispatchNote.customerId,
      dispatchNoteId: dispatchNote.id,
      invoiceNo,
      direction: InvoiceDirection.SALES,
      status: InvoiceStatus.ISSUED,
      issueDate: new Date(),
      deliveryDate: dispatchNote.deliveryDate,
      subtotal: Number(dispatchNote.subtotal),
      vatTotal: Number(dispatchNote.vatTotal),
      grandTotal: Number(dispatchNote.grandTotal),
      paidTotal: 0,
      note: `İrsaliyeden otomatik oluşturuldu: ${dispatchNote.dispatchNo}${dispatchNote.note ? `\n${dispatchNote.note}` : ""}`,
      items: {
        create: dispatchNote.items.map((item) => ({
          productId: item.productId,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          vatRate: Number(item.vatRate),
          lineTotal: Number(item.lineTotal),
        })),
      },
    },
  });

  await db.dispatchNote.update({
    where: { id: dispatchNote.id },
    data: { status: "INVOICED" },
  });

  if (dispatchNote.customerId) {
    await db.customer.update({
      where: { id: dispatchNote.customerId },
      data: { currentDebt: { increment: Number(dispatchNote.grandTotal) } },
    });
  }

  await ensureEInvoiceDraft(invoice.id, tenantId);

  return invoice;
}

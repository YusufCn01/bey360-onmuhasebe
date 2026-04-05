import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

type OrderItemInput = {
  productId?: string | null;
  quantity?: string | number;
  unitPrice?: string | number;
  vatRate?: string | number;
};

const allowedStatuses = new Set<OrderStatus>(["DRAFT", "APPROVED", "CANCELLED", "INVOICED"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const { orderId } = await params;
  const body = (await request.json().catch(() => null)) as
    | {
        status?: OrderStatus;
        note?: string;
        items?: OrderItemInput[];
      }
    | null;

  const order = await db.salesOrder.findFirst({
    where: { id: orderId, tenantId: context.tenant.id },
    include: { items: true, invoices: true },
  });
  if (!order) {
    return NextResponse.json({ success: false, error: "Sipariş bulunamadı." }, { status: 404 });
  }

  const status = body?.status && allowedStatuses.has(body.status) ? body.status : order.status;
  if (status === "INVOICED" && order.invoices.length === 0) {
    return NextResponse.json({ success: false, error: "Bağlı fatura olmadan sipariş durumu faturalandı yapılamaz." }, { status: 422 });
  }

  const items = Array.isArray(body?.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ success: false, error: "Sipariş için en az bir kalem olmalıdır." }, { status: 422 });
  }

  if (order.invoices.length > 0) {
    return NextResponse.json({ success: false, error: "Faturaya bağlı siparişlerin kalemleri değiştirilemez." }, { status: 409 });
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

    const updatedOrder = await db.$transaction(async (tx) => {
      await tx.salesOrderItem.deleteMany({ where: { orderId: order.id } });
      return tx.salesOrder.update({
        where: { id: order.id },
        data: {
          status,
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

    revalidatePath("/panel/teklif-siparis");
    revalidatePath("/panel");

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sipariş güncellenemedi.";
    return NextResponse.json({ success: false, error: message }, { status: 422 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const { orderId } = await params;
  const order = await db.salesOrder.findFirst({
    where: { id: orderId, tenantId: context.tenant.id },
    include: { invoices: true },
  });
  if (!order) {
    return NextResponse.json({ success: false, error: "Sipariş bulunamadı." }, { status: 404 });
  }

  if (order.invoices.length > 0) {
    return NextResponse.json({ success: false, error: "Faturaya dönüşmüş siparişler silinemez." }, { status: 409 });
  }

  await db.salesOrder.delete({ where: { id: order.id } });

  revalidatePath("/panel/teklif-siparis");
  revalidatePath("/panel");

  return NextResponse.json({ success: true });
}

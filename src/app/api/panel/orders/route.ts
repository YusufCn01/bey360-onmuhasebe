import { OrderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createOrderFromQuote, getNextDocumentNumber } from "@/lib/business/documents";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

type OrderItemInput = {
  productId?: string | null;
  quantity?: string | number;
  unitPrice?: string | number;
  vatRate?: string | number;
};

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        quoteId?: string;
        orderNo?: string;
        customerId?: string;
        items?: OrderItemInput[];
        note?: string;
      }
    | null;

  try {
    if (body?.quoteId) {
      const order = await createOrderFromQuote(body.quoteId, context.tenant.id, context.membership.branchId);
      revalidatePath("/panel/teklif-siparis");
      revalidatePath("/panel");
      return NextResponse.json({ success: true, data: { order, nextOrderNo: await getNextDocumentNumber(context.tenant.id, "ORDER") } });
    }

    if (!body?.customerId) {
      return NextResponse.json({ success: false, error: "Müşteri seçmelisiniz." }, { status: 422 });
    }

    const items = Array.isArray(body?.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json({ success: false, error: "Sipariş için en az bir kalem eklemelisiniz." }, { status: 422 });
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

    const orderNo = body.orderNo?.trim() || (await getNextDocumentNumber(context.tenant.id, "ORDER"));
    const subtotal = normalizedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const vatTotal = normalizedItems.reduce((sum, item) => sum + item.vatTotal, 0);
    const grandTotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);

    const order = await db.salesOrder.create({
      data: {
        tenantId: context.tenant.id,
        branchId: context.membership.branchId,
        customerId: body.customerId,
        orderNo,
        status: OrderStatus.APPROVED,
        issueDate: new Date(),
        subtotal,
        vatTotal,
        grandTotal,
        note: body.note?.trim() || null,
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

    revalidatePath("/panel/teklif-siparis");
    revalidatePath("/panel");

    return NextResponse.json({ success: true, data: { order, nextOrderNo: await getNextDocumentNumber(context.tenant.id, "ORDER") } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sipariş işlemi başarısız oldu.";
    return NextResponse.json({ success: false, error: message }, { status: 422 });
  }
}

import { ReturnDirection, ReturnReason, ReturnStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getNextDocumentNumber } from "@/lib/business/documents";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

type ReturnItemInput = {
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
        direction?: ReturnDirection;
        returnNo?: string;
        customerId?: string | null;
        supplierId?: string | null;
        relatedInvoiceId?: string | null;
        issueDate?: string;
        reason?: ReturnReason;
        note?: string;
        items?: ReturnItemInput[];
      }
    | null;

  try {
    const direction = body?.direction === ReturnDirection.PURCHASE ? ReturnDirection.PURCHASE : ReturnDirection.SALES;
    const items = Array.isArray(body?.items) ? body.items : [];

    if (!items.length) {
      return NextResponse.json({ success: false, error: "İade için en az bir kalem eklemelisiniz." }, { status: 422 });
    }

    if (direction === ReturnDirection.SALES && !body?.customerId) {
      return NextResponse.json({ success: false, error: "Satış iadesi için müşteri seçmelisiniz." }, { status: 422 });
    }

    if (direction === ReturnDirection.PURCHASE && !body?.supplierId) {
      return NextResponse.json({ success: false, error: "Satın alma iadesi için tedarikçi seçmelisiniz." }, { status: 422 });
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
        lineTotal: subtotal + vatTotal,
        subtotal,
        vatTotal,
      };
    });

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const vatTotal = normalizedItems.reduce((sum, item) => sum + item.vatTotal, 0);
    const grandTotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const returnNo =
      body?.returnNo?.trim() ||
      (await getNextDocumentNumber(context.tenant.id, direction === ReturnDirection.SALES ? "SALES_RETURN" : "PURCHASE_RETURN"));

    const returnDocument = await db.returnDocument.create({
      data: {
        tenantId: context.tenant.id,
        branchId: context.membership.branchId,
        customerId: direction === ReturnDirection.SALES ? body?.customerId ?? null : null,
        supplierId: direction === ReturnDirection.PURCHASE ? body?.supplierId ?? null : null,
        relatedInvoiceId: body?.relatedInvoiceId?.trim() || null,
        returnNo,
        direction,
        status: ReturnStatus.ISSUED,
        reason: body?.reason ?? ReturnReason.OTHER,
        issueDate: body?.issueDate ? new Date(body.issueDate) : new Date(),
        subtotal,
        vatTotal,
        grandTotal,
        note: body?.note?.trim() || null,
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

    if (direction === ReturnDirection.SALES && body?.customerId) {
      await db.customer.update({
        where: { id: body.customerId },
        data: { currentDebt: { decrement: grandTotal } },
      });
    }

    revalidatePath("/panel/iadeler");
    revalidatePath("/panel");
    revalidatePath("/panel/cari");

    return NextResponse.json({
      success: true,
      data: {
        returnDocument,
        nextReturnNo: await getNextDocumentNumber(context.tenant.id, direction === ReturnDirection.SALES ? "SALES_RETURN" : "PURCHASE_RETURN"),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "İade kaydı oluşturulamadı.";
    return NextResponse.json({ success: false, error: message }, { status: 422 });
  }
}

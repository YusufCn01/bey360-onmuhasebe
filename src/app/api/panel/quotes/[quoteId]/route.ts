import { revalidatePath } from "next/cache";
import { QuoteStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

type QuoteItemInput = {
  productId?: string | null;
  quantity?: string | number;
  unitPrice?: string | number;
  vatRate?: string | number;
};

const allowedStatuses = new Set<QuoteStatus>(["DRAFT", "SENT", "APPROVED", "REJECTED"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> },
) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const { quoteId } = await params;
  const body = (await request.json().catch(() => null)) as
    | {
        status?: QuoteStatus;
        validUntil?: string;
        note?: string;
        items?: QuoteItemInput[];
      }
    | null;

  const quote = await db.quote.findFirst({ where: { id: quoteId, tenantId: context.tenant.id }, include: { items: true } });
  if (!quote) {
    return NextResponse.json({ success: false, error: "Teklif bulunamadı." }, { status: 404 });
  }

  const status = body?.status && allowedStatuses.has(body.status) ? body.status : quote.status;
  const validUntil = body?.validUntil?.trim() ? new Date(body.validUntil) : null;
  if (body?.validUntil?.trim() && Number.isNaN(validUntil?.getTime())) {
    return NextResponse.json({ success: false, error: "Geçerlilik tarihi geçerli değil." }, { status: 422 });
  }

  const items = Array.isArray(body?.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ success: false, error: "Teklif için en az bir kalem olmalıdır." }, { status: 422 });
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

    const updatedQuote = await db.$transaction(async (tx) => {
      await tx.quoteItem.deleteMany({ where: { quoteId: quote.id } });
      return tx.quote.update({
        where: { id: quote.id },
        data: {
          status,
          validUntil,
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

    return NextResponse.json({ success: true, data: updatedQuote });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Teklif güncellenemedi.";
    return NextResponse.json({ success: false, error: message }, { status: 422 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> },
) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const { quoteId } = await params;
  const quote = await db.quote.findFirst({ where: { id: quoteId, tenantId: context.tenant.id } });
  if (!quote) {
    return NextResponse.json({ success: false, error: "Teklif bulunamadı." }, { status: 404 });
  }

  await db.quote.delete({ where: { id: quote.id } });

  revalidatePath("/panel/teklif-siparis");
  revalidatePath("/panel");

  return NextResponse.json({ success: true });
}

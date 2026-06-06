import { revalidatePath } from "next/cache";
import { ProductKind } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

function parseNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const context = await getTenantRouteContext();
  if (!context) return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });

  const { productId } = await params;
  const existing = await db.product.findFirst({ where: { id: productId, tenantId: context.tenant.id } });
  if (!existing) return NextResponse.json({ success: false, error: "Ürün bulunamadı." }, { status: 404 });

  const body = (await request.json().catch(() => null)) as Record<string, string> | null;
  const code = body?.code?.trim() ?? "";
  const name = body?.name?.trim() ?? "";
  if (!code || !name) return NextResponse.json({ success: false, error: "Ürün kodu ve ürün adı zorunludur." }, { status: 422 });

  const duplicate = await db.product.findFirst({ where: { tenantId: context.tenant.id, code, id: { not: productId } } });
  if (duplicate) return NextResponse.json({ success: false, error: "Bu ürün kodu başka bir kartta kullanılıyor." }, { status: 409 });

  const kind = body?.kind === ProductKind.SERVICE ? ProductKind.SERVICE : ProductKind.PRODUCT;
  const withholdingRate = kind === ProductKind.SERVICE ? parseNumber(body?.withholdingRate, 0) : 0;

  const product = await db.product.update({
    where: { id: productId },
    data: {
      code,
      name,
      kind,
      barcode: body?.barcode?.trim() || null,
      description: body?.description?.trim() || null,
      category: body?.category?.trim() || null,
      brand: body?.brand?.trim() || null,
      imageUrl: body?.imageUrl?.trim() || null,
      withholdingRate,
      withholdingCode: kind === ProductKind.SERVICE ? body?.withholdingCode?.trim() || null : null,
      unit: body?.unit?.trim() || (kind === ProductKind.SERVICE ? "Hizmet" : "Adet"),
      salePrice: parseNumber(body?.salePrice, 0),
      salePrice2: parseNumber(body?.salePrice2, 0),
      salePrice3: parseNumber(body?.salePrice3, 0),
      salePrice4: parseNumber(body?.salePrice4, 0),
      purchasePrice: parseNumber(body?.purchasePrice, 0),
      stockQty: kind === ProductKind.SERVICE ? 0 : parseNumber(body?.stockQty, 0),
      vatRate: parseNumber(body?.vatRate, 20),
    },
  });

  revalidatePath("/panel/stok");
  revalidatePath("/panel");
  return NextResponse.json({ success: true, data: product });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const context = await getTenantRouteContext();
  if (!context) return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });

  const { productId } = await params;
  const product = await db.product.findFirst({
    where: { id: productId, tenantId: context.tenant.id },
    include: { quoteItems: { take: 1 }, orderItems: { take: 1 }, invoiceItems: { take: 1 } },
  });
  if (!product) return NextResponse.json({ success: false, error: "Ürün bulunamadı." }, { status: 404 });
  if (product.quoteItems.length || product.orderItems.length || product.invoiceItems.length) {
    return NextResponse.json({ success: false, error: "Bu ürün teklif, sipariş veya fatura ile bağlı olduğu için silinemez." }, { status: 409 });
  }

  await db.product.delete({ where: { id: productId } });
  revalidatePath("/panel/stok");
  revalidatePath("/panel");
  return NextResponse.json({ success: true });
}

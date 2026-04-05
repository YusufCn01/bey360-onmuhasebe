import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

function parseNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        code?: string;
        name?: string;
        barcode?: string;
        description?: string;
        category?: string;
        brand?: string;
        imageUrl?: string;
        unit?: string;
        salePrice?: string;
        salePrice2?: string;
        salePrice3?: string;
        salePrice4?: string;
        purchasePrice?: string;
        stockQty?: string;
        vatRate?: string;
      }
    | null;

  const code = body?.code?.trim() ?? "";
  const name = body?.name?.trim() ?? "";

  if (!code || !name) {
    return NextResponse.json({ success: false, error: "Ürün kodu ve ürün adı zorunludur." }, { status: 422 });
  }

  const exists = await db.product.findFirst({ where: { tenantId: context.tenant.id, code } });
  if (exists) {
    return NextResponse.json({ success: false, error: "Bu ürün kodu bu firmada zaten kullanılıyor." }, { status: 409 });
  }

  const product = await db.product.create({
    data: {
      tenantId: context.tenant.id,
      code,
      name,
      barcode: body?.barcode?.trim() || null,
      description: body?.description?.trim() || null,
      category: body?.category?.trim() || null,
      brand: body?.brand?.trim() || null,
      imageUrl: body?.imageUrl?.trim() || null,
      unit: body?.unit?.trim() || "Adet",
      salePrice: parseNumber(body?.salePrice, 0),
      salePrice2: parseNumber(body?.salePrice2, 0),
      salePrice3: parseNumber(body?.salePrice3, 0),
      salePrice4: parseNumber(body?.salePrice4, 0),
      purchasePrice: parseNumber(body?.purchasePrice, 0),
      stockQty: parseNumber(body?.stockQty, 0),
      vatRate: parseNumber(body?.vatRate, 20),
    },
  });

  revalidatePath("/panel/stok");
  revalidatePath("/panel");

  return NextResponse.json({ success: true, data: product });
}

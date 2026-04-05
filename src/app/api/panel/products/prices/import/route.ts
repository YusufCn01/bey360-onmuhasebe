import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseProductPriceWorkbook } from "@/lib/product-excel";
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

  const formData = (await request.formData().catch(() => null)) as globalThis.FormData | null;
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: "Excel dosyası yüklenmedi." }, { status: 422 });
  }

  const rows = parseProductPriceWorkbook(await file.arrayBuffer());
  if (!rows.length) {
    return NextResponse.json({ success: false, error: "Excel dosyasında güncellenecek kayıt bulunamadı." }, { status: 422 });
  }

  const products = await db.product.findMany({
    where: { tenantId: context.tenant.id },
    select: { id: true, code: true, barcode: true },
  });

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const code = row.code.trim();
    const barcode = row.barcode.trim();
    const product = products.find((item) => item.code === code) ?? (barcode ? products.find((item) => item.barcode === barcode) : undefined);

    if (!product) {
      skipped += 1;
      continue;
    }

    await db.product.update({
      where: { id: product.id },
      data: {
        salePrice: parseNumber(row.salePrice, 0),
        salePrice2: parseNumber(row.salePrice2, 0),
        salePrice3: parseNumber(row.salePrice3, 0),
        salePrice4: parseNumber(row.salePrice4, 0),
        purchasePrice: parseNumber(row.purchasePrice, 0),
      },
    });

    updated += 1;
  }

  revalidatePath("/panel/stok");
  revalidatePath("/panel");

  return NextResponse.json({
    success: true,
    data: {
      updated,
      skipped,
      total: rows.length,
    },
  });
}

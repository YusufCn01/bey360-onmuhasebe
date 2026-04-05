import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseProductWorkbook, type ProductExcelPayload } from "@/lib/product-excel";
import { getTenantRouteContext } from "@/lib/session-context";

function parseNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildGeneratedProductCode(existingCodes: Set<string>) {
  let index = 1;

  while (true) {
    const code = `URN-${String(index).padStart(5, "0")}`;
    if (!existingCodes.has(code)) {
      existingCodes.add(code);
      return code;
    }
    index += 1;
  }
}

function toProductWriteData(row: ProductExcelPayload) {
  return {
    code: row.code.trim(),
    name: row.name.trim(),
    barcode: row.barcode.trim() || null,
    description: row.description.trim() || null,
    category: row.category.trim() || null,
    brand: row.brand.trim() || null,
    imageUrl: row.imageUrl.trim() || null,
    unit: row.unit.trim() || "Adet",
    salePrice: parseNumber(row.salePrice, 0),
    salePrice2: parseNumber(row.salePrice2, 0),
    salePrice3: parseNumber(row.salePrice3, 0),
    salePrice4: parseNumber(row.salePrice4, 0),
    purchasePrice: parseNumber(row.purchasePrice, 0),
    stockQty: parseNumber(row.stockQty, 0),
    vatRate: parseNumber(row.vatRate, 20),
  };
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

  const rows = parseProductWorkbook(await file.arrayBuffer());
  if (!rows.length) {
    return NextResponse.json({ success: false, error: "Excel dosyasında aktarılacak kayıt bulunamadı." }, { status: 422 });
  }

  const existingProducts = await db.product.findMany({
    where: { tenantId: context.tenant.id },
    select: { id: true, code: true, barcode: true },
  });
  const existingCodes = new Set(existingProducts.map((product) => product.code));

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const code = row.code.trim() || buildGeneratedProductCode(existingCodes);
    const name = row.name.trim();

    if (!name) {
      skipped += 1;
      continue;
    }

    const normalizedRow = { ...row, code };
    const existing = existingProducts.find((product) => product.code === code)
      ?? (row.barcode.trim() ? existingProducts.find((product) => product.barcode === row.barcode.trim()) : undefined);

    const data = {
      ...toProductWriteData(normalizedRow),
      tenantId: context.tenant.id,
    };

    if (existing) {
      await db.product.update({ where: { id: existing.id }, data });
      updated += 1;
      continue;
    }

    const created = await db.product.create({ data });
    existingProducts.push({ id: created.id, code: created.code, barcode: created.barcode });
    existingCodes.add(created.code);
    imported += 1;
  }

  revalidatePath("/panel/stok");
  revalidatePath("/panel");

  return NextResponse.json({
    success: true,
    data: {
      imported,
      updated,
      skipped,
      total: rows.length,
    },
  });
}

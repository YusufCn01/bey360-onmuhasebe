import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createProductExportWorkbook } from "@/lib/product-excel";
import { getTenantRouteContext } from "@/lib/session-context";

export async function GET() {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const products = await db.product.findMany({
    where: { tenantId: context.tenant.id },
    orderBy: { name: "asc" },
  });

  const buffer = createProductExportWorkbook(products);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="urunler.xlsx"',
    },
  });
}

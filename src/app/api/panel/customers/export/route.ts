import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createCustomerExportWorkbook, normalizeCustomerExcelFormat } from "@/lib/customer-excel";
import { getTenantRouteContext } from "@/lib/session-context";

export async function GET(request: Request) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = normalizeCustomerExcelFormat(searchParams.get("format"));

  const customers = await db.customer.findMany({
    where: { tenantId: context.tenant.id },
    orderBy: { name: "asc" },
  });

  const buffer = createCustomerExportWorkbook(customers, format);
  const filename = format === "logo" ? "musteriler-logo.xlsx" : "musteriler-hizli-bilisim.xlsx";

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

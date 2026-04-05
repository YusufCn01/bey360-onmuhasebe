import { NextResponse } from "next/server";
import { createCustomerTemplateWorkbook, normalizeCustomerExcelFormat } from "@/lib/customer-excel";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = normalizeCustomerExcelFormat(searchParams.get("format"));
  const buffer = createCustomerTemplateWorkbook(format);
  const filename = format === "logo" ? "logo-musteri-sablonu.xlsx" : "hizli-bilisim-cariler.xlsx";

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

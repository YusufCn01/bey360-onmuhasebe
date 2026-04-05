import { NextResponse } from "next/server";
import { createProductPriceTemplateWorkbook } from "@/lib/product-excel";

export async function GET() {
  const buffer = createProductPriceTemplateWorkbook();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="toplu-fiyat-sablonu.xlsx"',
    },
  });
}

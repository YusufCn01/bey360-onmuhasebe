import { NextResponse } from "next/server";
import { createProductTemplateWorkbook } from "@/lib/product-excel";

export async function GET() {
  const buffer = createProductTemplateWorkbook();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="urunler-sablon.xlsx"',
    },
  });
}

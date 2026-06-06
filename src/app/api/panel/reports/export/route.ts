import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/access";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { getWebReportsSnapshot } from "@/lib/reporting/live-reports";

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const { tenant } = await getTenantContext();
  const period = (request.nextUrl.searchParams.get("period") as "3m" | "6m" | "12m" | null) ?? "6m";
  const partyQuery = request.nextUrl.searchParams.get("party")?.trim().toLowerCase() ?? "";
  const productQuery = request.nextUrl.searchParams.get("product")?.trim().toLowerCase() ?? "";
  const statusQuery = request.nextUrl.searchParams.get("status")?.trim().toUpperCase() ?? "";

  const report = await getWebReportsSnapshot(tenant.id, {
    period,
    partyQuery,
    productQuery,
    statusQuery,
  });

  const lines: string[] = [];
  lines.push([csvCell("Alan"), csvCell("Değer")].join(","));
  lines.push([csvCell("Satış"), csvCell(formatCurrency(report.totalSales))].join(","));
  lines.push([csvCell("Alış"), csvCell(formatCurrency(report.totalPurchases))].join(","));
  lines.push([csvCell("Tahsilat"), csvCell(formatCurrency(report.receivable))].join(","));
  lines.push([csvCell("Ödeme"), csvCell(formatCurrency(report.payable))].join(","));
  lines.push("");
  lines.push([csvCell("Ürün"), csvCell("Miktar"), csvCell("Ciro")].join(","));
  for (const item of report.topProducts) {
    lines.push([csvCell(item.name), csvCell(formatNumber(item.qty)), csvCell(formatCurrency(item.revenue))].join(","));
  }
  lines.push("");
  lines.push([csvCell("Belge"), csvCell("Tarih"), csvCell("Taraf"), csvCell("Tutar")].join(","));
  for (const item of report.recentDocuments) {
    lines.push([
      csvCell(item.invoiceNo),
      csvCell(formatDate(item.issueDate)),
      csvCell(item.customer?.name ?? item.supplier?.name ?? "-"),
      csvCell(formatCurrency(Number(item.grandTotal))),
    ].join(","));
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=\"raporlar-${tenant.code}.csv\"`,
    },
  });
}

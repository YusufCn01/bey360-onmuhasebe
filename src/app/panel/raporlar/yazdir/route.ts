import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/access";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { getWebReportsSnapshot } from "@/lib/reporting/live-reports";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

  const html = `<!doctype html>
  <html lang="tr">
    <head>
      <meta charset="utf-8" />
      <title>Raporlar - ${escapeHtml(tenant.name)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; }
        h1, h2, h3, p { margin: 0; }
        .hero { border: 1px solid #dbe3ea; padding: 24px; margin-bottom: 24px; }
        .muted { color: #64748b; font-size: 12px; }
        .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
        .card { border: 1px solid #dbe3ea; padding: 16px; }
        .value { margin-top: 8px; font-size: 24px; font-weight: 800; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 0; text-align: left; font-size: 13px; }
        .section { border: 1px solid #dbe3ea; padding: 18px; margin-bottom: 24px; }
      </style>
    </head>
    <body>
      <div class="hero">
        <p class="muted">${escapeHtml(tenant.name)}</p>
        <h1 style="margin-top:8px;">Canlı Rapor Özeti</h1>
        <p class="muted" style="margin-top:8px;">Filtreler: ${escapeHtml([partyQuery || "-", productQuery || "-", statusQuery || "-"].join(" • "))}</p>
      </div>
      <div class="grid">
        <div class="card"><p class="muted">Satış</p><div class="value">${escapeHtml(formatCurrency(report.totalSales))}</div></div>
        <div class="card"><p class="muted">Alış</p><div class="value">${escapeHtml(formatCurrency(report.totalPurchases))}</div></div>
        <div class="card"><p class="muted">Tahsilat</p><div class="value">${escapeHtml(formatCurrency(report.receivable))}</div></div>
        <div class="card"><p class="muted">Ödeme</p><div class="value">${escapeHtml(formatCurrency(report.payable))}</div></div>
      </div>
      <div class="section">
        <h2>Ürün Performansı</h2>
        <table>
          <thead><tr><th>Ürün</th><th>Miktar</th><th>Ciro</th></tr></thead>
          <tbody>
            ${report.topProducts.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(formatNumber(item.qty))}</td><td>${escapeHtml(formatCurrency(item.revenue))}</td></tr>`).join("") || "<tr><td colspan='3'>Kayıt yok</td></tr>"}
          </tbody>
        </table>
      </div>
      <div class="section">
        <h2>Son Belgeler</h2>
        <table>
          <thead><tr><th>Belge</th><th>Tarih</th><th>Taraf</th><th>Tutar</th></tr></thead>
          <tbody>
            ${report.recentDocuments.map((item) => `<tr><td>${escapeHtml(item.invoiceNo)}</td><td>${escapeHtml(formatDate(item.issueDate))}</td><td>${escapeHtml(item.customer?.name ?? item.supplier?.name ?? "-")}</td><td>${escapeHtml(formatCurrency(Number(item.grandTotal)))}</td></tr>`).join("") || "<tr><td colspan='4'>Kayıt yok</td></tr>"}
          </tbody>
        </table>
      </div>
      <script>window.print();</script>
    </body>
  </html>`;

  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

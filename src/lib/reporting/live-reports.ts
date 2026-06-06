import { db } from "@/lib/db";

export type WebReportFilters = {
  period: "3m" | "6m" | "12m";
  partyQuery: string;
  productQuery: string;
  statusQuery: string;
};

type InvoiceRow = Awaited<
  ReturnType<
    typeof db.invoice.findMany<{
      include: { items: { include: { product: true } }; customer: true; supplier: true };
    }>
  >
>[number];

function buildMonthlyTrend(
  invoices: Array<{ issueDate: Date; direction: "SALES" | "PURCHASE"; grandTotal: unknown }>,
  monthWindow: number,
) {
  const formatter = new Intl.DateTimeFormat("tr-TR", { month: "short" });
  const months = Array.from({ length: monthWindow }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (monthWindow - 1 - index), 1);
    date.setHours(0, 0, 0, 0);

    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: formatter.format(date),
      receipts: 0,
      payments: 0,
    };
  });

  const bucket = new Map(months.map((month) => [month.key, month]));
  for (const invoice of invoices) {
    const issueDate = new Date(invoice.issueDate);
    const key = `${issueDate.getFullYear()}-${issueDate.getMonth()}`;
    const target = bucket.get(key);
    if (!target) continue;

    const value = Number(invoice.grandTotal);
    if (invoice.direction === "SALES") {
      target.receipts += value;
    } else {
      target.payments += value;
    }
  }

  return months;
}

function invoiceMatchesFilters(invoice: InvoiceRow, filters: Pick<WebReportFilters, "partyQuery" | "productQuery" | "statusQuery">) {
  const partyText = [invoice.customer?.name ?? "", invoice.customer?.taxNumber ?? "", invoice.supplier?.name ?? "", invoice.supplier?.taxNumber ?? ""]
    .join(" ")
    .toLowerCase();
  const productText = [
    invoice.invoiceNo,
    ...invoice.items.map((item) => `${item.description} ${item.product?.name ?? ""} ${item.product?.code ?? ""} ${item.product?.barcode ?? ""}`),
  ]
    .join(" ")
    .toLowerCase();
  const matchesParty = !filters.partyQuery || partyText.includes(filters.partyQuery);
  const matchesProduct = !filters.productQuery || productText.includes(filters.productQuery);
  const matchesStatus = !filters.statusQuery || invoice.status === filters.statusQuery;
  return matchesParty && matchesProduct && matchesStatus;
}

export async function getWebReportsSnapshot(tenantId: string, filters: WebReportFilters) {
  const monthWindow = filters.period === "3m" ? 3 : filters.period === "12m" ? 12 : 6;
  const [invoices, products, quotes, orders, payments] = await Promise.all([
    db.invoice.findMany({
      where: { tenantId },
      include: { items: { include: { product: true } }, customer: true, supplier: true },
      orderBy: { issueDate: "desc" },
    }),
    db.product.findMany({ where: { tenantId }, orderBy: { stockQty: "asc" }, take: 8 }),
    db.quote.findMany({ where: { tenantId }, include: { customer: true }, orderBy: { createdAt: "desc" } }),
    db.salesOrder.findMany({ where: { tenantId }, include: { customer: true }, orderBy: { createdAt: "desc" } }),
    db.payment.findMany({ where: { tenantId }, orderBy: { transactionAt: "desc" } }),
  ]);

  const filteredInvoices = invoices.filter((invoice) => invoiceMatchesFilters(invoice, filters));
  const filteredProducts = products.filter((product) => {
    const text = [product.name, product.code, product.barcode ?? "", product.brand ?? "", product.category ?? ""].join(" ").toLowerCase();
    return !filters.productQuery || text.includes(filters.productQuery);
  });
  const filteredQuotes = quotes.filter((quote) => !filters.partyQuery || (quote.customer?.name ?? "").toLowerCase().includes(filters.partyQuery));
  const filteredOrders = orders.filter((order) => !filters.partyQuery || (order.customer?.name ?? "").toLowerCase().includes(filters.partyQuery));

  const salesInvoices = filteredInvoices.filter((invoice) => invoice.direction === "SALES");
  const purchaseInvoices = filteredInvoices.filter((invoice) => invoice.direction === "PURCHASE");
  const totalSales = salesInvoices.reduce((sum, invoice) => sum + Number(invoice.grandTotal), 0);
  const totalPurchases = purchaseInvoices.reduce((sum, invoice) => sum + Number(invoice.grandTotal), 0);
  const totalCollections = payments.filter((payment) => payment.direction === "IN").reduce((sum, payment) => sum + Number(payment.amount), 0);
  const totalPayments = payments.filter((payment) => payment.direction === "OUT").reduce((sum, payment) => sum + Number(payment.amount), 0);
  const receivable = salesInvoices.reduce((sum, invoice) => sum + Math.max(Number(invoice.grandTotal) - Number(invoice.paidTotal), 0), 0);
  const payable = purchaseInvoices.reduce((sum, invoice) => sum + Math.max(Number(invoice.grandTotal) - Number(invoice.paidTotal), 0), 0);
  const quoteVolume = filteredQuotes.reduce((sum, quote) => sum + Number(quote.grandTotal), 0);
  const orderVolume = filteredOrders.reduce((sum, order) => sum + Number(order.grandTotal), 0);
  const monthlyTrend = buildMonthlyTrend(filteredInvoices, monthWindow);
  const chartData = monthlyTrend.map((item) => ({
    label: item.label,
    primary: item.receipts,
    secondary: item.payments,
  }));

  const productStats = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const invoice of salesInvoices) {
    for (const item of invoice.items) {
      const key = item.productId ?? item.description;
      const current = productStats.get(key) ?? { name: item.product?.name ?? item.description, qty: 0, revenue: 0 };
      current.qty += Number(item.quantity);
      current.revenue += Number(item.lineTotal);
      productStats.set(key, current);
    }
  }

  const topProducts = [...productStats.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  const atRiskProducts = filteredProducts.filter((product) => Number(product.stockQty) <= 10);
  const orderStatusRows = [
    { label: "Taslak sipariş", value: filteredOrders.filter((order) => order.status === "DRAFT").length },
    { label: "Onaylı sipariş", value: filteredOrders.filter((order) => order.status === "APPROVED").length },
    { label: "Faturalanmış sipariş", value: filteredOrders.filter((order) => order.status === "INVOICED").length },
    { label: "Açık teklif", value: filteredQuotes.filter((quote) => ["DRAFT", "SENT"].includes(quote.status)).length },
  ];
  const recentDocuments = [...filteredInvoices].sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime()).slice(0, 8);

  return {
    monthWindow,
    filteredInvoices,
    salesInvoices,
    purchaseInvoices,
    filteredProducts,
    filteredQuotes,
    filteredOrders,
    totalSales,
    totalPurchases,
    totalCollections,
    totalPayments,
    receivable,
    payable,
    quoteVolume,
    orderVolume,
    chartData,
    topProducts,
    atRiskProducts,
    orderStatusRows,
    recentDocuments,
  };
}

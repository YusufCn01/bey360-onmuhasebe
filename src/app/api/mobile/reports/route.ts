import { EInvoiceProvider, InvoiceDirection, InvoiceStatus, ProductKind, type Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCustomerCreditCount, getDashboardInfo, loginToHizliBilisim } from "@/lib/integrations/hizli-bilisim";
import { getMobileTenantContext } from "@/lib/mobile-session";

type ReportKey = "sales" | "finance" | "edoc" | "resources";
type FilterInput = {
  partyTerm: string;
  productTerm: string;
  statusTerm: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value)
    : "-";
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(date);
}

function sumOpenBalance(items: Array<{ grandTotal: number; paidTotal: number }>) {
  return items.reduce((total, item) => total + Math.max(0, Number(item.grandTotal) - Number(item.paidTotal)), 0);
}

function normalizeTerm(value: string | null) {
  return value?.trim() ?? "";
}

function buildMonthlySeries(entries: Array<{ issueDate: Date; grandTotal: number }>, months = 6) {
  const now = new Date();
  const buckets = Array.from({ length: months }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - index - 1), 1);
    return {
      key: monthKey(date),
      label: monthLabel(date),
      value: 0,
    };
  });

  const bucketMap = new Map(buckets.map((item) => [item.key, item]));
  for (const entry of entries) {
    const key = monthKey(entry.issueDate);
    const bucket = bucketMap.get(key);
    if (bucket) {
      bucket.value += Number(entry.grandTotal) || 0;
    }
  }

  return buckets;
}

function toDateRange(request: NextRequest) {
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const fromValue = request.nextUrl.searchParams.get("from");
  const toValue = request.nextUrl.searchParams.get("to");

  const from = fromValue ? new Date(`${fromValue}T00:00:00`) : defaultFrom;
  const to = toValue
    ? new Date(`${toValue}T23:59:59.999`)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return null;
  }

  return { from, to };
}

function getPreviousRange(from: Date, to: Date) {
  const span = to.getTime() - from.getTime();
  const previousTo = new Date(from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - span);
  return { previousFrom, previousTo };
}

function buildComparison(current: Array<{ label: string; value: number }>, previous: Array<{ label: string; value: number }>) {
  return current.map((item, index) => {
    const previousValue = previous[index]?.value ?? 0;
    const delta = item.value - previousValue;
    return {
      label: item.label,
      current: formatNumber(item.value),
      previous: formatNumber(previousValue),
      delta: delta === 0 ? "0" : `${delta > 0 ? "+" : ""}${formatNumber(delta)}`,
    };
  });
}

function parseInvoiceStatus(statusTerm: string) {
  const normalized = statusTerm.trim().toUpperCase();

  if (!normalized) return null;
  if (normalized === "DRAFT" || normalized === "TASLAK") return { equals: InvoiceStatus.DRAFT } as const;
  if (normalized === "ISSUED" || normalized === "KESILDI" || normalized === "KESİLDİ") return { equals: InvoiceStatus.ISSUED } as const;
  if (normalized === "PARTIAL" || normalized === "KISMI") return { equals: InvoiceStatus.PARTIAL } as const;
  if (normalized === "PAID" || normalized === "ODENDI" || normalized === "ÖDENDİ") return { equals: InvoiceStatus.PAID } as const;
  if (normalized === "CANCELLED" || normalized === "IPTAL" || normalized === "İPTAL") return { equals: InvoiceStatus.CANCELLED } as const;
  if (normalized === "ACIK" || normalized === "AÇIK") return { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIAL] as InvoiceStatus[] } as const;

  return null;
}

function describeFilters(report: ReportKey, filters: FilterInput) {
  const parts: string[] = [];

  if (report === "sales") {
    if (filters.partyTerm) parts.push(`Müşteri: ${filters.partyTerm}`);
    if (filters.productTerm) parts.push(`Ürün: ${filters.productTerm}`);
    if (filters.statusTerm) parts.push(`Durum: ${filters.statusTerm}`);
  } else if (report === "finance") {
    if (filters.partyTerm) parts.push(`Tedarikçi: ${filters.partyTerm}`);
    if (filters.productTerm) parts.push(`Masraf / ürün: ${filters.productTerm}`);
    if (filters.statusTerm) parts.push(`Durum: ${filters.statusTerm}`);
  } else if (report === "edoc") {
    if (filters.partyTerm) parts.push(`Ünvan / VKN: ${filters.partyTerm}`);
    if (filters.productTerm) parts.push(`Belge no: ${filters.productTerm}`);
    if (filters.statusTerm) parts.push(`Durum: ${filters.statusTerm}`);
  } else {
    if (filters.partyTerm) parts.push(`Cari / tedarikçi: ${filters.partyTerm}`);
    if (filters.productTerm) parts.push(`Ürün / hizmet: ${filters.productTerm}`);
    if (filters.statusTerm) parts.push(`Tür: ${filters.statusTerm}`);
  }

  return parts.length ? parts.join(" • ") : "Filtre uygulanmadı";
}

function buildInvoiceWhere(input: {
  tenantId: string;
  direction: InvoiceDirection;
  from: Date;
  to: Date;
  filters: FilterInput;
}): Prisma.InvoiceWhereInput {
  const where: Prisma.InvoiceWhereInput = {
    tenantId: input.tenantId,
    direction: input.direction,
    issueDate: { gte: input.from, lte: input.to },
  };

  const and: Prisma.InvoiceWhereInput[] = [];
  const statusFilter = parseInvoiceStatus(input.filters.statusTerm);
  if (statusFilter?.equals) {
    where.status = statusFilter.equals;
  } else if (statusFilter?.in) {
    where.status = { in: statusFilter.in };
  } else {
    where.status = { not: InvoiceStatus.CANCELLED };
  }

  if (input.filters.partyTerm) {
    const partyTerm = input.filters.partyTerm;
    if (input.direction === InvoiceDirection.SALES) {
      and.push({
        customer: {
          is: {
            OR: [
              { name: { contains: partyTerm } },
              { code: { contains: partyTerm } },
              { taxNumber: { contains: partyTerm } },
            ],
          },
        },
      });
    } else {
      and.push({
        supplier: {
          is: {
            OR: [
              { name: { contains: partyTerm } },
              { code: { contains: partyTerm } },
              { taxNumber: { contains: partyTerm } },
            ],
          },
        },
      });
    }
  }

  if (input.filters.productTerm) {
    const productTerm = input.filters.productTerm;
    and.push({
      items: {
        some: {
          OR: [
            { description: { contains: productTerm } },
            {
              product: {
                is: {
                  OR: [
                    { name: { contains: productTerm } },
                    { code: { contains: productTerm } },
                    { barcode: { contains: productTerm } },
                  ],
                },
              },
            },
          ],
        },
      },
    });
  }

  if (and.length) {
    where.AND = and;
  }

  return where;
}

export async function GET(request: NextRequest) {
  const context = await getMobileTenantContext(request);
  if (!context) {
    return NextResponse.json({ success: false, error: { message: "Mobil oturum geçersiz." } }, { status: 401 });
  }

  const report = (request.nextUrl.searchParams.get("report") || "sales") as ReportKey;
  if (!["sales", "finance", "edoc", "resources"].includes(report)) {
    return NextResponse.json({ success: false, error: { message: "Geçersiz rapor tipi." } }, { status: 422 });
  }

  const range = toDateRange(request);
  if (!range) {
    return NextResponse.json({ success: false, error: { message: "Geçersiz tarih aralığı." } }, { status: 422 });
  }

  const filters: FilterInput = {
    partyTerm: normalizeTerm(request.nextUrl.searchParams.get("party")),
    productTerm: normalizeTerm(request.nextUrl.searchParams.get("product")),
    statusTerm: normalizeTerm(request.nextUrl.searchParams.get("status")),
  };

  const { from, to } = range;
  const { previousFrom, previousTo } = getPreviousRange(from, to);
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const settings = await db.eInvoiceSettings.findUnique({ where: { tenantId: context.tenant.id } });
  const formattedRange = `${new Intl.DateTimeFormat("tr-TR", { dateStyle: "short" }).format(from)} - ${new Intl.DateTimeFormat("tr-TR", { dateStyle: "short" }).format(to)}`;
  const appliedFilters = describeFilters(report, filters);

  if (report === "sales") {
    const currentWhere = buildInvoiceWhere({
      tenantId: context.tenant.id,
      direction: InvoiceDirection.SALES,
      from,
      to,
      filters,
    });
    const previousWhere = buildInvoiceWhere({
      tenantId: context.tenant.id,
      direction: InvoiceDirection.SALES,
      from: previousFrom,
      to: previousTo,
      filters,
    });

    const [salesInvoices, currentSales, previousSales, currentOpenReceivables, previousOpenReceivables, currentQuotes, previousQuotes, currentOrders, previousOrders, topCustomers] =
      await Promise.all([
        db.invoice.findMany({
          where: {
            tenantId: context.tenant.id,
            direction: InvoiceDirection.SALES,
            issueDate: { gte: sixMonthsAgo },
            status: { not: InvoiceStatus.CANCELLED },
          },
          select: { issueDate: true, grandTotal: true },
          orderBy: { issueDate: "asc" },
        }),
        db.invoice.aggregate({ where: currentWhere, _sum: { grandTotal: true }, _count: { _all: true } }),
        db.invoice.aggregate({ where: previousWhere, _sum: { grandTotal: true }, _count: { _all: true } }),
        db.invoice.findMany({
          where: { ...currentWhere, status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIAL] } },
          select: { grandTotal: true, paidTotal: true },
        }),
        db.invoice.findMany({
          where: { ...previousWhere, status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIAL] } },
          select: { grandTotal: true, paidTotal: true },
        }),
        db.quote.count({ where: { tenantId: context.tenant.id, createdAt: { gte: from, lte: to } } }),
        db.quote.count({ where: { tenantId: context.tenant.id, createdAt: { gte: previousFrom, lte: previousTo } } }),
        db.salesOrder.count({ where: { tenantId: context.tenant.id, createdAt: { gte: from, lte: to } } }),
        db.salesOrder.count({ where: { tenantId: context.tenant.id, createdAt: { gte: previousFrom, lte: previousTo } } }),
        db.invoice.groupBy({
          by: ["customerId"],
          where: {
            ...currentWhere,
            customerId: { not: null },
          },
          _sum: { grandTotal: true },
          orderBy: { _sum: { grandTotal: "desc" } },
          take: 3,
        }),
      ]);

    const customerIds = topCustomers.map((item) => item.customerId).filter(Boolean) as string[];
    const customers = customerIds.length
      ? await db.customer.findMany({
          where: { tenantId: context.tenant.id, id: { in: customerIds } },
          select: { id: true, name: true },
        })
      : [];
    const customerMap = new Map(customers.map((item) => [item.id, item.name]));
    const receivable = sumOpenBalance(currentOpenReceivables);
    const previousReceivable = sumOpenBalance(previousOpenReceivables);
    const currentAmount = currentSales._sum.grandTotal ?? 0;
    const previousAmount = previousSales._sum.grandTotal ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        key: "sales",
        title: "Satış Raporu",
        subtitle: "Canlı satış performansı, tahsilat ve sipariş akışı",
        highlightLabel: "Seçili dönem satış tutarı",
        highlightValue: formatCurrency(currentAmount),
        chart: [
          { label: "Satış tutarı", value: currentAmount, compareValue: previousAmount, accent: true },
          { label: "Fatura adedi", value: currentSales._count._all, compareValue: previousSales._count._all },
          { label: "Açık tahsilat", value: receivable, compareValue: previousReceivable },
          { label: "Teklif", value: currentQuotes, compareValue: previousQuotes },
          { label: "Sipariş", value: currentOrders, compareValue: previousOrders },
        ],
        summary: [
          { label: "Açık tahsilat", value: formatCurrency(receivable) },
          { label: "Fatura adedi", value: formatNumber(currentSales._count._all) },
          { label: "Teklif", value: formatNumber(currentQuotes) },
          { label: "Sipariş", value: formatNumber(currentOrders) },
        ],
        details: [
          { label: "Tarih aralığı", value: formattedRange },
          { label: "Uygulanan filtreler", value: appliedFilters },
          ...topCustomers.map((item, index) => ({
            label: `En yüksek müşteri ${index + 1}`,
            value: `${customerMap.get(item.customerId ?? "") ?? "Tanımsız"} • ${formatCurrency(item._sum.grandTotal ?? 0)}`,
          })),
          { label: "Son 6 ay eğilimi", value: buildMonthlySeries(salesInvoices).map((item) => `${item.label} ${formatNumber(item.value)}`).join(" • ") },
        ],
        comparison: buildComparison(
          [
            { label: "Satış tutarı", value: currentAmount },
            { label: "Fatura adedi", value: currentSales._count._all },
            { label: "Teklif", value: currentQuotes },
            { label: "Sipariş", value: currentOrders },
          ],
          [
            { label: "Satış tutarı", value: previousAmount },
            { label: "Fatura adedi", value: previousSales._count._all },
            { label: "Teklif", value: previousQuotes },
            { label: "Sipariş", value: previousOrders },
          ],
        ),
      },
    });
  }

  if (report === "finance") {
    const currentWhere = buildInvoiceWhere({
      tenantId: context.tenant.id,
      direction: InvoiceDirection.PURCHASE,
      from,
      to,
      filters,
    });
    const previousWhere = buildInvoiceWhere({
      tenantId: context.tenant.id,
      direction: InvoiceDirection.PURCHASE,
      from: previousFrom,
      to: previousTo,
      filters,
    });

    const [currentPurchases, previousPurchases, receivableInvoices, payableInvoices, cashAccounts, bankAccounts, recentExpenses, previousExpenses] = await Promise.all([
      db.invoice.aggregate({ where: currentWhere, _sum: { grandTotal: true }, _count: { _all: true } }),
      db.invoice.aggregate({ where: previousWhere, _sum: { grandTotal: true }, _count: { _all: true } }),
      db.invoice.findMany({
        where: {
          tenantId: context.tenant.id,
          direction: InvoiceDirection.SALES,
          status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIAL] },
        },
        select: { grandTotal: true, paidTotal: true },
      }),
      db.invoice.findMany({
        where: {
          ...currentWhere,
          status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIAL] },
        },
        select: { grandTotal: true, paidTotal: true },
      }),
      db.cashAccount.findMany({ where: { tenantId: context.tenant.id }, select: { balance: true } }),
      db.bankAccount.findMany({ where: { tenantId: context.tenant.id }, select: { balance: true } }),
      db.expenseRecord.findMany({
        where: {
          tenantId: context.tenant.id,
          transactionAt: { gte: from, lte: to },
          ...(filters.productTerm ? { title: { contains: filters.productTerm } } : {}),
        },
        orderBy: { transactionAt: "desc" },
        take: 3,
        select: { title: true, amount: true },
      }),
      db.expenseRecord.aggregate({
        where: {
          tenantId: context.tenant.id,
          transactionAt: { gte: previousFrom, lte: previousTo },
          ...(filters.productTerm ? { title: { contains: filters.productTerm } } : {}),
        },
        _sum: { amount: true },
      }),
    ]);

    const receivable = sumOpenBalance(receivableInvoices);
    const payable = sumOpenBalance(payableInvoices);
    const cashTotal = cashAccounts.reduce((sum, item) => sum + Number(item.balance), 0);
    const bankTotal = bankAccounts.reduce((sum, item) => sum + Number(item.balance), 0);
    const currentAmount = currentPurchases._sum.grandTotal ?? 0;
    const previousAmount = previousPurchases._sum.grandTotal ?? 0;
    const previousExpenseTotal = previousExpenses._sum.amount ?? 0;
    const currentExpenseTotal = recentExpenses.reduce((sum, item) => sum + Number(item.amount), 0);

    return NextResponse.json({
      success: true,
      data: {
        key: "finance",
        title: "Finans Raporu",
        subtitle: "Canlı borç, alacak ve hazır bakiye görünümü",
        highlightLabel: "Net pozisyon",
        highlightValue: formatCurrency(receivable - payable),
        chart: [
          { label: "Alış tutarı", value: currentAmount, compareValue: previousAmount, accent: true },
          { label: "Açık ödeme", value: payable, compareValue: previousAmount },
          { label: "Kasa", value: cashTotal },
          { label: "Banka", value: bankTotal },
          { label: "Gider", value: currentExpenseTotal, compareValue: previousExpenseTotal },
        ],
        summary: [
          { label: "Kasa toplamı", value: formatCurrency(cashTotal) },
          { label: "Banka toplamı", value: formatCurrency(bankTotal) },
          { label: "Açık tahsilat", value: formatCurrency(receivable) },
          { label: "Açık ödeme", value: formatCurrency(payable) },
        ],
        details: [
          { label: "Tarih aralığı", value: formattedRange },
          { label: "Uygulanan filtreler", value: appliedFilters },
          ...recentExpenses.map((item, index) => ({
            label: `Son gider ${index + 1}`,
            value: `${item.title} • ${formatCurrency(item.amount)}`,
          })),
        ],
        comparison: buildComparison(
          [
            { label: "Alış tutarı", value: currentAmount },
            { label: "Alış adedi", value: currentPurchases._count._all },
            { label: "Gider toplamı", value: currentExpenseTotal },
          ],
          [
            { label: "Alış tutarı", value: previousAmount },
            { label: "Alış adedi", value: previousPurchases._count._all },
            { label: "Gider toplamı", value: previousExpenseTotal },
          ],
        ),
      },
    });
  }

  if (report === "edoc") {
    const documentWhere: Prisma.EInvoiceDocumentWhereInput = {
      tenantId: context.tenant.id,
      createdAt: { gte: from, lte: to },
    };
    const previousDocumentWhere: Prisma.EInvoiceDocumentWhereInput = {
      tenantId: context.tenant.id,
      createdAt: { gte: previousFrom, lte: previousTo },
    };
    const statusNormalized = filters.statusTerm.trim().toUpperCase();

    if (filters.partyTerm || filters.productTerm) {
      const invoiceFilter: Prisma.InvoiceWhereInput = {
        OR: [
          filters.partyTerm
            ? {
                customer: {
                  is: {
                    OR: [
                      { name: { contains: filters.partyTerm } },
                      { taxNumber: { contains: filters.partyTerm } },
                    ],
                  },
                },
              }
            : undefined,
          filters.partyTerm
            ? {
                supplier: {
                  is: {
                    OR: [
                      { name: { contains: filters.partyTerm } },
                      { taxNumber: { contains: filters.partyTerm } },
                    ],
                  },
                },
              }
            : undefined,
          filters.productTerm ? { invoiceNo: { contains: filters.productTerm } } : undefined,
        ].filter(Boolean) as Prisma.InvoiceWhereInput[],
      };

      documentWhere.invoice = { is: invoiceFilter };
      previousDocumentWhere.invoice = { is: invoiceFilter };
    }

    if (statusNormalized) {
      if (["DRAFT", "READY", "SENT", "FAILED"].includes(statusNormalized)) {
        documentWhere.status = statusNormalized as "DRAFT" | "READY" | "SENT" | "FAILED";
        previousDocumentWhere.status = statusNormalized as "DRAFT" | "READY" | "SENT" | "FAILED";
      } else if (statusNormalized === "TASLAK") {
        documentWhere.status = { in: ["DRAFT", "READY"] };
        previousDocumentWhere.status = { in: ["DRAFT", "READY"] };
      } else if (statusNormalized === "HATALI") {
        documentWhere.status = "FAILED";
        previousDocumentWhere.status = "FAILED";
      } else if (statusNormalized === "ONAYLI") {
        documentWhere.status = "SENT";
        previousDocumentWhere.status = "SENT";
      }
    }

    let incomingInvoices: number | null = 0;
    let outgoingInvoices: number | null = 0;
    let archiveInvoices: number | null = 0;
    let remainCredit: number | null = settings?.serviceCreditCount ?? null;
    let senderAlias = settings?.gibAlias ?? null;
    let note = settings?.serviceEndpoint?.toLowerCase().includes("econnecttest") || settings?.testMode ? "Test ortamı" : "Canlı ortam";

    const canRefreshProvider =
      settings?.provider === EInvoiceProvider.HIZLI_BILISIM &&
      Boolean(settings.senderTaxNumber && settings.serviceEndpoint && settings.serviceUsername && settings.servicePassword && settings.serviceApiKey);

    if (canRefreshProvider && settings?.senderTaxNumber) {
      try {
        const login = await loginToHizliBilisim(settings);
        if (login.success) {
          const [creditInfo, dashboard] = await Promise.all([
            getCustomerCreditCount(settings, settings.senderTaxNumber, login),
            getDashboardInfo(settings, settings.senderTaxNumber, login),
          ]);

          remainCredit = creditInfo.remainCredit ?? dashboard.creditRemainder ?? remainCredit;
          incomingInvoices = dashboard.inboxCount ?? 0;
          outgoingInvoices = dashboard.outboxCount ?? 0;
          archiveInvoices = dashboard.archiveCount ?? 0;
          note = [creditInfo.note, dashboard.note].filter(Boolean).join(" • ") || note;
        }
      } catch {
        // Servis hata verse de rapor açılmalı.
      }
    }

    const [currentDrafts, previousDrafts, currentSent, previousSent, currentFailed, previousFailed] = await Promise.all([
      db.eInvoiceDocument.count({ where: { ...documentWhere, status: { in: ["DRAFT", "READY"] } } }),
      db.eInvoiceDocument.count({ where: { ...previousDocumentWhere, status: { in: ["DRAFT", "READY"] } } }),
      db.eInvoiceDocument.count({ where: { ...documentWhere, status: "SENT" } }),
      db.eInvoiceDocument.count({ where: { ...previousDocumentWhere, status: "SENT" } }),
      db.eInvoiceDocument.count({ where: { ...documentWhere, status: "FAILED" } }),
      db.eInvoiceDocument.count({ where: { ...previousDocumentWhere, status: "FAILED" } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        key: "edoc",
        title: "E-Belge Raporu",
        subtitle: "Canlı entegratör sayıları ve belge akışı",
        highlightLabel: "Kalan kontör",
        highlightValue: formatNumber(remainCredit),
        chart: [
          { label: "Gelen", value: incomingInvoices ?? 0, compareValue: 0, accent: true },
          { label: "Giden", value: outgoingInvoices ?? 0, compareValue: currentSent },
          { label: "Arşiv", value: archiveInvoices ?? 0 },
          { label: "Taslak", value: currentDrafts, compareValue: previousDrafts },
          { label: "Hatalı", value: currentFailed, compareValue: previousFailed },
        ],
        summary: [
          { label: "Gönderici alias", value: senderAlias ?? "-" },
          { label: "Sağlayıcı", value: settings?.provider ?? "HIZLI_BILISIM" },
          { label: "Ortam", value: settings?.serviceEndpoint?.toLowerCase().includes("econnecttest") || settings?.testMode ? "Test" : "Canlı" },
          { label: "Servis notu", value: note ?? "-" },
        ],
        details: [
          { label: "Tarih aralığı", value: formattedRange },
          { label: "Uygulanan filtreler", value: appliedFilters },
          { label: "Yerel gönderildi", value: formatNumber(currentSent) },
          { label: "Yerel hatalı", value: formatNumber(currentFailed) },
          { label: "Gelen kutusu", value: formatNumber(incomingInvoices) },
          { label: "Giden kutusu", value: formatNumber(outgoingInvoices) },
        ],
        comparison: buildComparison(
          [
            { label: "Taslak belge", value: currentDrafts },
            { label: "Gönderilen belge", value: currentSent },
            { label: "Hatalı belge", value: currentFailed },
          ],
          [
            { label: "Taslak belge", value: previousDrafts },
            { label: "Gönderilen belge", value: previousSent },
            { label: "Hatalı belge", value: previousFailed },
          ],
        ),
      },
    });
  }

  const resourceKind = filters.statusTerm.trim().toUpperCase();
  const customerWhere: Prisma.CustomerWhereInput = {
    tenantId: context.tenant.id,
    createdAt: { gte: from, lte: to },
    ...(filters.partyTerm
      ? {
          OR: [
            { name: { contains: filters.partyTerm } },
            { code: { contains: filters.partyTerm } },
            { taxNumber: { contains: filters.partyTerm } },
          ],
        }
      : {}),
  };
  const previousCustomerWhere: Prisma.CustomerWhereInput = {
    tenantId: context.tenant.id,
    createdAt: { gte: previousFrom, lte: previousTo },
    ...(filters.partyTerm
      ? {
          OR: [
            { name: { contains: filters.partyTerm } },
            { code: { contains: filters.partyTerm } },
            { taxNumber: { contains: filters.partyTerm } },
          ],
        }
      : {}),
  };
  const supplierWhere: Prisma.SupplierWhereInput = {
    tenantId: context.tenant.id,
    createdAt: { gte: from, lte: to },
    ...(filters.partyTerm
      ? {
          OR: [
            { name: { contains: filters.partyTerm } },
            { code: { contains: filters.partyTerm } },
            { taxNumber: { contains: filters.partyTerm } },
          ],
        }
      : {}),
  };
  const previousSupplierWhere: Prisma.SupplierWhereInput = {
    tenantId: context.tenant.id,
    createdAt: { gte: previousFrom, lte: previousTo },
    ...(filters.partyTerm
      ? {
          OR: [
            { name: { contains: filters.partyTerm } },
            { code: { contains: filters.partyTerm } },
            { taxNumber: { contains: filters.partyTerm } },
          ],
        }
      : {}),
  };
  const productWhere: Prisma.ProductWhereInput = {
    tenantId: context.tenant.id,
    createdAt: { gte: from, lte: to },
    ...(filters.productTerm
      ? {
          OR: [
            { name: { contains: filters.productTerm } },
            { code: { contains: filters.productTerm } },
            { barcode: { contains: filters.productTerm } },
          ],
        }
      : {}),
    ...((resourceKind === "PRODUCT" || resourceKind === "ÜRÜN" || resourceKind === "URUN")
      ? { kind: ProductKind.PRODUCT }
      : (resourceKind === "SERVICE" || resourceKind === "HİZMET" || resourceKind === "HIZMET")
        ? { kind: ProductKind.SERVICE }
        : {}),
  };
  const previousProductWhere: Prisma.ProductWhereInput = {
    tenantId: context.tenant.id,
    createdAt: { gte: previousFrom, lte: previousTo },
    ...(filters.productTerm
      ? {
          OR: [
            { name: { contains: filters.productTerm } },
            { code: { contains: filters.productTerm } },
            { barcode: { contains: filters.productTerm } },
          ],
        }
      : {}),
    ...((resourceKind === "PRODUCT" || resourceKind === "ÜRÜN" || resourceKind === "URUN")
      ? { kind: ProductKind.PRODUCT }
      : (resourceKind === "SERVICE" || resourceKind === "HİZMET" || resourceKind === "HIZMET")
        ? { kind: ProductKind.SERVICE }
        : {}),
  };

  const [currentCustomers, previousCustomers, currentSuppliers, previousSuppliers, currentProducts, previousProducts, recentCustomers, recentSuppliers, recentProducts] = await Promise.all([
    resourceKind === "SUPPLIER" || resourceKind === "TEDARIKCI" || resourceKind === "TEDARİKÇİ" ? 0 : db.customer.count({ where: customerWhere }),
    resourceKind === "SUPPLIER" || resourceKind === "TEDARIKCI" || resourceKind === "TEDARİKÇİ" ? 0 : db.customer.count({ where: previousCustomerWhere }),
    resourceKind === "CUSTOMER" || resourceKind === "MUSTERI" || resourceKind === "MÜŞTERİ" ? 0 : db.supplier.count({ where: supplierWhere }),
    resourceKind === "CUSTOMER" || resourceKind === "MUSTERI" || resourceKind === "MÜŞTERİ" ? 0 : db.supplier.count({ where: previousSupplierWhere }),
    db.product.count({ where: productWhere }),
    db.product.count({ where: previousProductWhere }),
    db.customer.findMany({ where: customerWhere, orderBy: { updatedAt: "desc" }, take: 3, select: { name: true } }),
    db.supplier.findMany({ where: supplierWhere, orderBy: { updatedAt: "desc" }, take: 3, select: { name: true } }),
    db.product.findMany({ where: productWhere, orderBy: { updatedAt: "desc" }, take: 3, select: { name: true } }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      key: "resources",
      title: "Kaynak Raporu",
      subtitle: "Canlı cari, tedarikçi ve stok hacmi",
      highlightLabel: "Dönem yeni kartları",
      highlightValue: formatNumber(currentCustomers + currentSuppliers + currentProducts),
      chart: [
        { label: "Cari", value: currentCustomers, compareValue: previousCustomers, accent: true },
        { label: "Tedarikçi", value: currentSuppliers, compareValue: previousSuppliers },
        { label: "Stok", value: currentProducts, compareValue: previousProducts },
      ],
      summary: [
        { label: "Yeni müşteri", value: formatNumber(currentCustomers) },
        { label: "Yeni tedarikçi", value: formatNumber(currentSuppliers) },
        { label: "Yeni stok kartı", value: formatNumber(currentProducts) },
      ],
      details: [
        { label: "Tarih aralığı", value: formattedRange },
        { label: "Uygulanan filtreler", value: appliedFilters },
        ...recentCustomers.map((item, index) => ({ label: `Son cari ${index + 1}`, value: item.name })),
        ...recentSuppliers.slice(0, 1).map((item) => ({ label: "Son tedarikçi", value: item.name })),
        ...recentProducts.slice(0, 1).map((item) => ({ label: "Son stok kartı", value: item.name })),
      ],
      comparison: buildComparison(
        [
          { label: "Yeni müşteri", value: currentCustomers },
          { label: "Yeni tedarikçi", value: currentSuppliers },
          { label: "Yeni stok", value: currentProducts },
        ],
        [
          { label: "Yeni müşteri", value: previousCustomers },
          { label: "Yeni tedarikçi", value: previousSuppliers },
          { label: "Yeni stok", value: previousProducts },
        ],
      ),
    },
  });
}

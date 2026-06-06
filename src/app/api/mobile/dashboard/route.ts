import { EInvoiceProvider, InvoiceDirection, InvoiceStatus, ReminderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCustomerCreditCount, getDashboardInfo, loginToHizliBilisim } from "@/lib/integrations/hizli-bilisim";
import { getMobileTenantContext } from "@/lib/mobile-session";

function sumOpenBalance(items: Array<{ grandTotal: number; paidTotal: number }>) {
  return items.reduce((total, item) => total + Math.max(0, Number(item.grandTotal) - Number(item.paidTotal)), 0);
}

function toIso(value?: Date | null) {
  return value ? value.toISOString() : null;
}

export async function GET(request: NextRequest) {
  const context = await getMobileTenantContext(request);
  if (!context) {
    return NextResponse.json({ success: false, error: { message: "Mobil oturum gecersiz veya suresi dolmus." } }, { status: 401 });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    customerCount,
    supplierCount,
    productCount,
    quoteCount,
    orderCount,
    eInvoiceDraftCount,
    salesInvoiceCount,
    purchaseInvoiceCount,
    salesTotals,
    purchaseTotals,
    receivableInvoices,
    payableInvoices,
    overdueCollectionCount,
    reminders,
    unreadReminderCount,
    overdueReminderCount,
    recentSalesInvoices,
    recentPurchaseInvoices,
    recentCustomers,
    recentSuppliers,
    recentProducts,
    recentDispatchNotes,
    recentReturns,
    recentExpenses,
    recentChequeNotes,
    cashAccounts,
    bankAccounts,
    recentEDocuments,
    settings,
  ] = await Promise.all([
    db.customer.count({ where: { tenantId: context.tenant.id } }),
    db.supplier.count({ where: { tenantId: context.tenant.id } }),
    db.product.count({ where: { tenantId: context.tenant.id } }),
    db.quote.count({ where: { tenantId: context.tenant.id } }),
    db.salesOrder.count({ where: { tenantId: context.tenant.id } }),
    db.eInvoiceDocument.count({ where: { tenantId: context.tenant.id, status: { in: ["DRAFT", "READY"] } } }),
    db.invoice.count({ where: { tenantId: context.tenant.id, direction: InvoiceDirection.SALES } }),
    db.invoice.count({ where: { tenantId: context.tenant.id, direction: InvoiceDirection.PURCHASE } }),
    db.invoice.aggregate({
      where: {
        tenantId: context.tenant.id,
        direction: InvoiceDirection.SALES,
        issueDate: { gte: monthStart },
        status: { not: InvoiceStatus.CANCELLED },
      },
      _sum: { grandTotal: true },
    }),
    db.invoice.aggregate({
      where: {
        tenantId: context.tenant.id,
        direction: InvoiceDirection.PURCHASE,
        issueDate: { gte: monthStart },
        status: { not: InvoiceStatus.CANCELLED },
      },
      _sum: { grandTotal: true },
    }),
    db.invoice.findMany({
      where: {
        tenantId: context.tenant.id,
        direction: InvoiceDirection.SALES,
        status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIAL] },
      },
      select: { grandTotal: true, paidTotal: true, dueDate: true },
    }),
    db.invoice.findMany({
      where: {
        tenantId: context.tenant.id,
        direction: InvoiceDirection.PURCHASE,
        status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIAL] },
      },
      select: { grandTotal: true, paidTotal: true },
    }),
    db.invoice.count({
      where: {
        tenantId: context.tenant.id,
        direction: InvoiceDirection.SALES,
        status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIAL] },
        dueDate: { lt: now },
      },
    }),
    db.reminder.findMany({
      where: { tenantId: context.tenant.id },
      orderBy: [{ isRead: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        message: true,
        dueAt: true,
        isRead: true,
        status: true,
        channel: true,
      },
    }),
    db.reminder.count({
      where: {
        tenantId: context.tenant.id,
        status: ReminderStatus.OPEN,
        isRead: false,
      },
    }),
    db.reminder.count({
      where: {
        tenantId: context.tenant.id,
        status: ReminderStatus.OPEN,
        dueAt: { lt: now },
      },
    }),
    db.invoice.findMany({
      where: { tenantId: context.tenant.id, direction: InvoiceDirection.SALES },
      orderBy: { issueDate: "desc" },
      take: 4,
      select: {
        id: true,
        invoiceNo: true,
        issueDate: true,
        grandTotal: true,
        status: true,
        customer: {
          select: {
            name: true,
          },
        },
      },
    }),
    db.invoice.findMany({
      where: { tenantId: context.tenant.id, direction: InvoiceDirection.PURCHASE },
      orderBy: { issueDate: "desc" },
      take: 4,
      select: {
        id: true,
        invoiceNo: true,
        issueDate: true,
        grandTotal: true,
        status: true,
        supplier: {
          select: {
            name: true,
          },
        },
      },
    }),
    db.customer.findMany({
      where: { tenantId: context.tenant.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        code: true,
        name: true,
        city: true,
        currentDebt: true,
        currentCredit: true,
        eInvoiceRegistered: true,
      },
    }),
    db.supplier.findMany({
      where: { tenantId: context.tenant.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        code: true,
        name: true,
        city: true,
        taxNumber: true,
      },
    }),
    db.product.findMany({
      where: { tenantId: context.tenant.id },
      orderBy: [{ updatedAt: "desc" }],
      take: 5,
      select: {
        id: true,
        code: true,
        barcode: true,
        name: true,
        kind: true,
        unit: true,
        stockQty: true,
        salePrice: true,
        purchasePrice: true,
        vatRate: true,
      },
    }),
    db.dispatchNote.findMany({
      where: { tenantId: context.tenant.id },
      orderBy: { issueDate: "desc" },
      take: 5,
      select: {
        id: true,
        dispatchNo: true,
        issueDate: true,
        grandTotal: true,
        status: true,
        customer: { select: { name: true } },
      },
    }),
    db.returnDocument.findMany({
      where: { tenantId: context.tenant.id },
      orderBy: { issueDate: "desc" },
      take: 5,
      select: {
        id: true,
        returnNo: true,
        issueDate: true,
        grandTotal: true,
        status: true,
        direction: true,
        customer: { select: { name: true } },
        supplier: { select: { name: true } },
      },
    }),
    db.expenseRecord.findMany({
      where: { tenantId: context.tenant.id },
      orderBy: { transactionAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        category: true,
        amount: true,
        transactionAt: true,
      },
    }),
    db.chequeNote.findMany({
      where: { tenantId: context.tenant.id },
      orderBy: { issueDate: "desc" },
      take: 5,
      select: {
        id: true,
        referenceNo: true,
        type: true,
        direction: true,
        status: true,
        amount: true,
        dueDate: true,
        customer: { select: { name: true } },
        supplier: { select: { name: true } },
      },
    }),
    db.cashAccount.findMany({
      where: { tenantId: context.tenant.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        balance: true,
      },
    }),
    db.bankAccount.findMany({
      where: { tenantId: context.tenant.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        bankName: true,
        iban: true,
        balance: true,
      },
    }),
    db.eInvoiceDocument.findMany({
      where: { tenantId: context.tenant.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        scenario: true,
        status: true,
        createdAt: true,
        invoice: {
          select: {
            invoiceNo: true,
            customer: { select: { name: true } },
          },
        },
      },
    }),
    db.eInvoiceSettings.findUnique({ where: { tenantId: context.tenant.id } }),
  ]);

  const receivable = sumOpenBalance(receivableInvoices);
  const payable = sumOpenBalance(payableInvoices);

  let providerSummary = {
    provider: settings?.provider ?? EInvoiceProvider.NONE,
    creditCount: settings?.serviceCreditCount ?? null,
    updatedAt: toIso(settings?.serviceCreditUpdatedAt),
    environment: settings?.serviceEndpoint?.toLowerCase().includes("econnecttest") || settings?.testMode ? "TEST" : "CANLI",
    senderAlias: settings?.gibAlias ?? null,
    incomingInvoices: null as number | null,
    outgoingInvoices: null as number | null,
    archiveInvoices: null as number | null,
    incomingDespatch: null as number | null,
    outgoingDespatch: null as number | null,
    note: null as string | null,
  };

  const shouldRefreshProvider =
    settings?.provider === EInvoiceProvider.HIZLI_BILISIM &&
    Boolean(settings.senderTaxNumber && settings.serviceEndpoint && settings.serviceUsername && settings.servicePassword && settings.serviceApiKey) &&
    (!settings.serviceCreditUpdatedAt || Date.now() - settings.serviceCreditUpdatedAt.getTime() > 5 * 60 * 1000);

  if (shouldRefreshProvider && settings?.senderTaxNumber) {
    try {
      const login = await loginToHizliBilisim(settings);
      if (login.success) {
        const [creditInfo, dashboard] = await Promise.all([
          getCustomerCreditCount(settings, settings.senderTaxNumber, login),
          getDashboardInfo(settings, settings.senderTaxNumber, login),
        ]);

        const nextCreditCount = creditInfo.remainCredit ?? dashboard.creditRemainder ?? settings.serviceCreditCount ?? null;
        const updated = await db.eInvoiceSettings.update({
          where: { tenantId: context.tenant.id },
          data: {
            serviceCreditCount:
              typeof nextCreditCount === "number" && Number.isFinite(nextCreditCount) ? Math.max(0, Math.floor(nextCreditCount)) : settings.serviceCreditCount,
            serviceCreditUpdatedAt: new Date(),
          },
          select: {
            serviceCreditCount: true,
            serviceCreditUpdatedAt: true,
          },
        });

        providerSummary = {
          ...providerSummary,
          creditCount: updated.serviceCreditCount ?? providerSummary.creditCount,
          updatedAt: toIso(updated.serviceCreditUpdatedAt),
          incomingInvoices: dashboard.inboxCount ?? null,
          outgoingInvoices: dashboard.outboxCount ?? null,
          archiveInvoices: dashboard.archiveCount ?? null,
          incomingDespatch: dashboard.despatchInboxCount ?? null,
          outgoingDespatch: dashboard.despatchOutboxCount ?? null,
          note: [creditInfo.note, dashboard.note].filter(Boolean).join(" · ") || null,
        };
      }
    } catch {
      // Mobil dashboard servis kaynakli hatalarda da acilabilmeli.
    }
  }

  const creditCount = providerSummary.creditCount;

  return NextResponse.json({
    success: true,
    data: {
      user: {
        fullName: context.user.fullName,
        email: context.user.email,
        role: context.membership.role,
      },
      tenant: {
        name: context.tenant.name,
        code: context.tenant.code,
        planName: context.tenant.planName,
        status: context.tenant.status,
      },
      metrics: {
        monthlySales: salesTotals._sum.grandTotal ?? 0,
        monthlyPurchases: purchaseTotals._sum.grandTotal ?? 0,
        receivable,
        payable,
        customerCount,
        supplierCount,
        productCount,
        quoteCount,
        orderCount,
        salesInvoiceCount,
        purchaseInvoiceCount,
        eInvoiceDraftCount,
        overdueCollectionCount,
      },
      provider: {
        ...providerSummary,
        lowCredit: typeof creditCount === "number" && creditCount <= 250,
      },
      reminders: {
        unreadCount: unreadReminderCount,
        overdueCount: overdueReminderCount,
        items: reminders.map((item) => ({
          ...item,
          dueAt: item.dueAt.toISOString(),
        })),
      },
      recentSalesInvoices: recentSalesInvoices.map((item) => ({
        id: item.id,
        invoiceNo: item.invoiceNo,
        issueDate: item.issueDate.toISOString(),
        grandTotal: item.grandTotal,
        status: item.status,
        customerName: item.customer?.name ?? "Muhtelif Musteriler",
      })),
      recentPurchaseInvoices: recentPurchaseInvoices.map((item) => ({
        id: item.id,
        invoiceNo: item.invoiceNo,
        issueDate: item.issueDate.toISOString(),
        grandTotal: item.grandTotal,
        status: item.status,
        supplierName: item.supplier?.name ?? "Tedarikci tanimsiz",
      })),
      recentCustomers: recentCustomers.map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        city: item.city,
        balance: Number(item.currentCredit) - Number(item.currentDebt),
        eInvoiceRegistered: item.eInvoiceRegistered,
      })),
      recentSuppliers: recentSuppliers.map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        city: item.city,
        taxNumber: item.taxNumber,
      })),
      recentProducts: recentProducts.map((item) => ({
        id: item.id,
        code: item.code,
        barcode: item.barcode,
        name: item.name,
        kind: item.kind,
        unit: item.unit,
        stockQty: item.stockQty,
        salePrice: item.salePrice,
        purchasePrice: item.purchasePrice,
        vatRate: item.vatRate,
      })),
      recentDispatchNotes: recentDispatchNotes.map((item) => ({
        id: item.id,
        dispatchNo: item.dispatchNo,
        issueDate: item.issueDate.toISOString(),
        grandTotal: item.grandTotal,
        status: item.status,
        customerName: item.customer?.name ?? "Muhtelif Musteriler",
      })),
      recentReturns: recentReturns.map((item) => ({
        id: item.id,
        returnNo: item.returnNo,
        issueDate: item.issueDate.toISOString(),
        grandTotal: item.grandTotal,
        status: item.status,
        direction: item.direction,
        partyName: item.customer?.name ?? item.supplier?.name ?? "Cari tanimsiz",
      })),
      recentExpenses: recentExpenses.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        amount: item.amount,
        transactionAt: item.transactionAt.toISOString(),
      })),
      recentChequeNotes: recentChequeNotes.map((item) => ({
        id: item.id,
        referenceNo: item.referenceNo,
        type: item.type,
        direction: item.direction,
        status: item.status,
        amount: item.amount,
        dueDate: item.dueDate?.toISOString() ?? null,
        partyName: item.customer?.name ?? item.supplier?.name ?? "Cari tanimsiz",
      })),
      cashAccounts: cashAccounts.map((item) => ({
        id: item.id,
        name: item.name,
        balance: item.balance,
      })),
      bankAccounts: bankAccounts.map((item) => ({
        id: item.id,
        bankName: item.bankName,
        iban: item.iban,
        balance: item.balance,
      })),
      recentEDocuments: recentEDocuments.map((item) => ({
        id: item.id,
        invoiceNo: item.invoice.invoiceNo,
        scenario: item.scenario,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        customerName: item.invoice.customer?.name ?? "Muhtelif Musteriler",
      })),
    },
  });
}

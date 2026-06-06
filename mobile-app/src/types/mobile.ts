export type MobileAuthSession = {
  token: string;
};

export type MobileDashboardPayload = {
  user: {
    fullName: string;
    email: string;
    role: string;
  };
  tenant: {
    name: string;
    code: string;
    planName: string;
    status: string;
  };
  metrics: {
    monthlySales: number;
    monthlyPurchases: number;
    receivable: number;
    payable: number;
    customerCount: number;
    supplierCount: number;
    productCount: number;
    quoteCount: number;
    orderCount: number;
    salesInvoiceCount: number;
    purchaseInvoiceCount: number;
    eInvoiceDraftCount: number;
    overdueCollectionCount: number;
  };
  provider: {
    provider: string;
    creditCount: number | null;
    updatedAt: string | null;
    environment: string;
    senderAlias: string | null;
    incomingInvoices: number | null;
    outgoingInvoices: number | null;
    archiveInvoices: number | null;
    incomingDespatch: number | null;
    outgoingDespatch: number | null;
    note: string | null;
    lowCredit: boolean;
  };
  reminders: {
    unreadCount: number;
    overdueCount: number;
    items: Array<{
      id: string;
      title: string;
      message: string | null;
      dueAt: string;
      isRead: boolean;
      status: string;
      channel: string;
    }>;
  };
  recentSalesInvoices: Array<{
    id: string;
    invoiceNo: string;
    issueDate: string;
    grandTotal: number;
    status: string;
    customerName: string;
  }>;
  recentPurchaseInvoices: Array<{
    id: string;
    invoiceNo: string;
    issueDate: string;
    grandTotal: number;
    status: string;
    supplierName: string;
  }>;
  recentCustomers: Array<{
    id: string;
    code: string;
    name: string;
    city: string | null;
    balance: number;
    eInvoiceRegistered: boolean | null;
  }>;
  recentSuppliers: Array<{
    id: string;
    code: string;
    name: string;
    city: string | null;
    taxNumber: string | null;
  }>;
  recentProducts: Array<{
    id: string;
    code: string;
    barcode: string | null;
    name: string;
    kind: string;
    unit: string;
    stockQty: number;
    salePrice: number;
    purchasePrice: number;
    vatRate: number;
  }>;
  recentDispatchNotes: Array<{
    id: string;
    dispatchNo: string;
    issueDate: string;
    grandTotal: number;
    status: string;
    customerName: string;
  }>;
  recentReturns: Array<{
    id: string;
    returnNo: string;
    issueDate: string;
    grandTotal: number;
    status: string;
    direction: string;
    partyName: string;
  }>;
  recentExpenses: Array<{
    id: string;
    title: string;
    category: string;
    amount: number;
    transactionAt: string;
  }>;
  recentChequeNotes: Array<{
    id: string;
    referenceNo: string;
    type: string;
    direction: string;
    status: string;
    amount: number;
    dueDate: string | null;
    partyName: string;
  }>;
  cashAccounts: Array<{
    id: string;
    name: string;
    balance: number;
  }>;
  bankAccounts: Array<{
    id: string;
    bankName: string;
    iban: string;
    balance: number;
  }>;
  recentEDocuments: Array<{
    id: string;
    invoiceNo: string;
    scenario: string;
    status: string;
    createdAt: string;
    customerName: string;
  }>;
};

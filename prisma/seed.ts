import {
  CrmLeadStatus,
  CrmTaskPriority,
  CrmTaskStatus,
  EInvoiceDocumentStatus,
  EInvoiceProvider,
  EInvoiceScenario,
  GlobalRole,
  InvoiceDirection,
  InvoiceStatus,
  MembershipRole,
  OrderStatus,
  PaymentDirection,
  PaymentMethod,
  PrismaClient,
  QuoteStatus,
  TenantStatus,
} from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  await prisma.crmLeadNote.deleteMany();
  await prisma.crmTask.deleteMany();
  await prisma.crmLead.deleteMany();
  await prisma.eInvoiceDocument.deleteMany();
  await prisma.eInvoiceSettings.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.salesOrderItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.expenseRecord.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.cashAccount.deleteMany();
  await prisma.dealerApplication.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.packagePlan.deleteMany();
  await prisma.user.deleteMany();

  const founder = await prisma.user.create({
    data: {
      email: "kurucu@bey360.local",
      passwordHash: await hashPassword("Demo1234!"),
      fullName: "Bey360 Kurucu",
      globalRole: GlobalRole.FOUNDER,
    },
  });

  const owner = await prisma.user.create({
    data: {
      email: "owner@demo.local",
      passwordHash: await hashPassword("Demo1234!"),
      fullName: "Ahmet Yilmaz",
      globalRole: GlobalRole.USER,
    },
  });

  const accounting = await prisma.user.create({
    data: {
      email: "muhasebe@demo.local",
      passwordHash: await hashPassword("Demo1234!"),
      fullName: "Ayse Karaca",
      globalRole: GlobalRole.USER,
    },
  });

  const sales = await prisma.user.create({
    data: {
      email: "satis@demo.local",
      passwordHash: await hashPassword("Demo1234!"),
      fullName: "Mert Aksoy",
      globalRole: GlobalRole.USER,
    },
  });

  const [starterPlan, professionalPlan] = await Promise.all([
    prisma.packagePlan.create({
      data: {
        code: "STARTER",
        name: "Baslangic",
        monthlyPrice: 490,
        yearlyPrice: 4900,
        userLimit: 2,
        branchLimit: 1,
      },
    }),
    prisma.packagePlan.create({
      data: {
        code: "PRO",
        name: "Profesyonel",
        monthlyPrice: 990,
        yearlyPrice: 9900,
        userLimit: 10,
        branchLimit: 5,
      },
    }),
  ]);

  const tenant = await prisma.tenant.create({
    data: {
      name: "Bey360 Demo Market",
      slug: "demo-market",
      code: "BEY360_DEMO",
      phone: "0212 555 10 10",
      city: "Istanbul",
      district: "Sisli",
      status: TenantStatus.ACTIVE,
      planName: "Profesyonel",
      taxNumber: "1234567890",
      email: "info@demo.local",
      createdByUserId: founder.id,
      packagePlanId: professionalPlan.id,
    },
  });

  const mainBranch = await prisma.branch.create({
    data: {
      tenantId: tenant.id,
      name: "Merkez Sube",
      code: "MRK",
      city: "Istanbul",
      district: "Sisli",
      isMain: true,
      phone: "0212 555 10 10",
    },
  });

  await prisma.membership.createMany({
    data: [
      { userId: owner.id, tenantId: tenant.id, branchId: mainBranch.id, role: MembershipRole.OWNER },
      { userId: accounting.id, tenantId: tenant.id, branchId: mainBranch.id, role: MembershipRole.ACCOUNTING },
      { userId: sales.id, tenantId: tenant.id, branchId: mainBranch.id, role: MembershipRole.SALES },
    ],
  });

  const [customerA, customerB] = await Promise.all([
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        code: "CR0001",
        name: "Ayse Emlak Ofisi",
        phone: "0532 111 22 33",
        city: "Istanbul",
        taxNumber: "1111111111",
        currentDebt: 4500,
      },
    }),
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        code: "CR0002",
        name: "Mehmet Lojistik AS",
        phone: "0532 222 33 44",
        city: "Istanbul",
        taxNumber: "2222222222",
        currentDebt: 12750,
      },
    }),
  ]);

  const supplier = await prisma.supplier.create({
    data: {
      tenantId: tenant.id,
      code: "TR0001",
      name: "Beta Tedarik Ltd.",
      phone: "0216 444 55 66",
      city: "Kocaeli",
    },
  });

  const [productA, productB, productC] = await Promise.all([
    prisma.product.create({
      data: {
        tenantId: tenant.id,
        code: "UR0001",
        name: "Barkod Okuyucu",
        unit: "Adet",
        salePrice: 4500,
        purchasePrice: 3200,
        stockQty: 18,
      },
    }),
    prisma.product.create({
      data: {
        tenantId: tenant.id,
        code: "UR0002",
        name: "Fis Yazici",
        unit: "Adet",
        salePrice: 2750,
        purchasePrice: 1900,
        stockQty: 11,
      },
    }),
    prisma.product.create({
      data: {
        tenantId: tenant.id,
        code: "UR0003",
        name: "ERP Destek Paketi",
        unit: "Hizmet",
        salePrice: 12500,
        purchasePrice: 0,
        stockQty: 999,
      },
    }),
  ]);

  const [leadA, leadB, leadC] = await Promise.all([
    prisma.crmLead.create({
      data: {
        tenantId: tenant.id,
        customerId: customerA.id,
        ownerUserId: sales.id,
        title: "Ayse Emlak POS donusum paketi",
        contactName: "Ayse Gok",
        contactEmail: "ayse@ornek.com",
        contactPhone: "0532 111 22 33",
        source: "Web formu",
        status: CrmLeadStatus.PROPOSAL,
        expectedValue: 5400,
        probability: 65,
        nextActionAt: new Date("2026-04-02T10:00:00.000Z"),
        summary: "Teklif gonderildi, iki gun icinde geri donus bekleniyor.",
      },
    }),
    prisma.crmLead.create({
      data: {
        tenantId: tenant.id,
        customerId: customerB.id,
        ownerUserId: owner.id,
        title: "Mehmet Lojistik stok ve barkod iyilestirme",
        contactName: "Onur Keskin",
        contactEmail: "onur@lojistik.com",
        contactPhone: "0532 222 33 44",
        source: "Saha referansi",
        status: CrmLeadStatus.NEGOTIATION,
        expectedValue: 18000,
        probability: 80,
        nextActionAt: new Date("2026-04-01T13:30:00.000Z"),
        summary: "Demo tamamlandi, sozlesme maddeleri gozden geciriliyor.",
      },
    }),
    prisma.crmLead.create({
      data: {
        tenantId: tenant.id,
        ownerUserId: sales.id,
        title: "Istanbul perakende zinciri yeni firsat",
        contactName: "Zeynep Kara",
        contactEmail: "zeynep@perakende.com",
        contactPhone: "0534 123 45 67",
        source: "Referans",
        status: CrmLeadStatus.CONTACTED,
        expectedValue: 27500,
        probability: 35,
        nextActionAt: new Date("2026-04-03T08:30:00.000Z"),
        summary: "Ilk gorusme yapildi, ihtiyac listesi bekleniyor.",
      },
    }),
  ]);

  await prisma.crmLeadNote.createMany({
    data: [
      {
        tenantId: tenant.id,
        leadId: leadA.id,
        userId: sales.id,
        content: "Musteri kampanyali fiyat talep etti, revize teklif hazirlaniyor.",
      },
      {
        tenantId: tenant.id,
        leadId: leadB.id,
        userId: owner.id,
        content: "Karar verici ekip ile ikinci toplantinin tarihini netlestirdik.",
      },
      {
        tenantId: tenant.id,
        leadId: leadC.id,
        userId: sales.id,
        content: "Barkod, stok ve e-Fatura modullerine ilgi var.",
      },
    ],
  });

  await prisma.crmTask.createMany({
    data: [
      {
        tenantId: tenant.id,
        leadId: leadA.id,
        assignedUserId: sales.id,
        title: "Ayse Emlak teklifine takip aramasi yap",
        dueAt: new Date("2026-04-02T09:00:00.000Z"),
        status: CrmTaskStatus.OPEN,
        priority: CrmTaskPriority.HIGH,
        note: "Onay gelirse kurulum takvimi netlestirilecek.",
      },
      {
        tenantId: tenant.id,
        leadId: leadB.id,
        assignedUserId: owner.id,
        title: "Mehmet Lojistik sozlesme notlarini guncelle",
        dueAt: new Date("2026-04-01T11:00:00.000Z"),
        status: CrmTaskStatus.IN_PROGRESS,
        priority: CrmTaskPriority.HIGH,
        note: "Odeme plani ve montaj tarihi ayni dokumanda toparlanacak.",
      },
      {
        tenantId: tenant.id,
        leadId: leadC.id,
        assignedUserId: sales.id,
        title: "Yeni firsat icin demo takvimi olustur",
        dueAt: new Date("2026-04-04T12:00:00.000Z"),
        status: CrmTaskStatus.OPEN,
        priority: CrmTaskPriority.NORMAL,
        note: "Musteri once depo akisini gormek istiyor.",
      },
    ],
  });

  const quote = await prisma.quote.create({
    data: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      customerId: customerA.id,
      quoteNo: "TKL-00001",
      status: QuoteStatus.SENT,
      subtotal: 4500,
      vatTotal: 900,
      grandTotal: 5400,
      items: {
        create: {
          productId: productA.id,
          description: productA.name,
          quantity: 1,
          unitPrice: 4500,
          vatRate: 20,
          lineTotal: 5400,
        },
      },
    },
  });

  const order = await prisma.salesOrder.create({
    data: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      customerId: customerB.id,
      orderNo: "SIP-00001",
      status: OrderStatus.APPROVED,
      subtotal: 15000,
      vatTotal: 3000,
      grandTotal: 18000,
      items: {
        create: [
          {
            productId: productA.id,
            description: productA.name,
            quantity: 2,
            unitPrice: 4500,
            vatRate: 20,
            lineTotal: 10800,
          },
          {
            productId: productB.id,
            description: productB.name,
            quantity: 2,
            unitPrice: 2750,
            vatRate: 20,
            lineTotal: 6600,
          },
        ],
      },
    },
  });

  const salesInvoice = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      customerId: customerA.id,
      orderId: order.id,
      invoiceNo: "SAT-00001",
      direction: InvoiceDirection.SALES,
      status: InvoiceStatus.PARTIAL,
      subtotal: 15000,
      vatTotal: 3000,
      grandTotal: 18000,
      paidTotal: 4500,
      items: {
        create: [
          {
            productId: productA.id,
            description: productA.name,
            quantity: 2,
            unitPrice: 4500,
            vatRate: 20,
            lineTotal: 10800,
          },
          {
            productId: productB.id,
            description: productB.name,
            quantity: 2,
            unitPrice: 2750,
            vatRate: 20,
            lineTotal: 6600,
          },
        ],
      },
    },
  });

  const purchaseInvoice = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      supplierId: supplier.id,
      invoiceNo: "ALI-00001",
      direction: InvoiceDirection.PURCHASE,
      status: InvoiceStatus.ISSUED,
      subtotal: 9000,
      vatTotal: 1800,
      grandTotal: 10800,
      items: {
        create: {
          productId: productC.id,
          description: "Sunucu Lisansi",
          quantity: 1,
          unitPrice: 9000,
          vatRate: 20,
          lineTotal: 10800,
        },
      },
    },
  });

  await prisma.payment.createMany({
    data: [
      {
        tenantId: tenant.id,
        invoiceId: salesInvoice.id,
        direction: PaymentDirection.IN,
        method: PaymentMethod.BANK,
        amount: 4500,
        description: "Kismi tahsilat",
      },
      {
        tenantId: tenant.id,
        invoiceId: purchaseInvoice.id,
        direction: PaymentDirection.OUT,
        method: PaymentMethod.CASH,
        amount: 3200,
        description: "Tedarikci on odeme",
      },
    ],
  });

  await prisma.cashAccount.create({
    data: {
      tenantId: tenant.id,
      name: "Merkez Kasa",
      balance: 85420,
    },
  });

  await prisma.bankAccount.create({
    data: {
      tenantId: tenant.id,
      bankName: "Is Bankasi",
      iban: "TR00 0000 0000 0000 0000 0000 01",
      balance: 126892.81,
    },
  });

  await prisma.expenseRecord.createMany({
    data: [
      {
        tenantId: tenant.id,
        title: "Ofis Kirasi",
        category: "Genel Gider",
        amount: 22000,
      },
      {
        tenantId: tenant.id,
        title: "Internet ve Telefon",
        category: "Operasyon",
        amount: 4250,
      },
    ],
  });

  await prisma.eInvoiceSettings.create({
    data: {
      tenantId: tenant.id,
      provider: EInvoiceProvider.GIB,
      senderTitle: tenant.name,
      senderTaxNumber: tenant.taxNumber,
      gibAlias: "urn:mail:demo@efatura.gov.tr",
      archiveEnabled: true,
      autoSend: true,
      testMode: true,
      serviceSecretKey: "8b7b5bc21aa2398b2031ba02ec8516341f65",
      serviceApiKey: "8b7b5bc2baa2",
      serviceUsername: "S1q5jNIaexrHMtvzg+ZJWA==",
      servicePassword: "kBOdl86Q4PuynyZzfQKL6w==",
      serviceEndpoint: "https://econnecttest.hizliteknoloji.com.tr/Services/HizliService.svc",
      serviceCompanyCode: "DEMO01",
      serviceCreditCount: 1250,
      serviceCreditUpdatedAt: new Date(),
    },
  });

  await prisma.eInvoiceDocument.create({
    data: {
      tenantId: tenant.id,
      invoiceId: salesInvoice.id,
      provider: EInvoiceProvider.GIB,
      scenario: EInvoiceScenario.E_ARCHIVE,
      status: EInvoiceDocumentStatus.READY,
      responseNote: "Demo belge taslagi hazir",
    },
  });

  await prisma.dealerApplication.createMany({
    data: [
      {
        tenantId: tenant.id,
        packagePlanId: professionalPlan.id,
        companyName: "Ankara Bayi Cozum",
        contactName: "Murat Demir",
        email: "murat@ankarabayi.com",
        phone: "0533 777 88 99",
        city: "Ankara",
        commissionRate: 12,
        note: `Demo tenant icin bayi ornegi olusturuldu. Teklif ${quote.quoteNo}`,
        status: "REVIEWING",
      },
      {
        packagePlanId: starterPlan.id,
        companyName: "Ege Yazilim Cozumleri",
        contactName: "Selin Arslan",
        email: "selin@egecozum.com",
        phone: "0534 222 11 00",
        city: "Izmir",
        commissionRate: 10,
        note: "Kurucu panelinden degerlendirmeyi bekleyen yeni bayi basvurusu.",
        status: "NEW",
      },
    ],
  });

  console.log("Seed tamamlandi:", {
    founder: founder.email,
    owner: owner.email,
    accounting: accounting.email,
    sales: sales.email,
    tenant: tenant.name,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });


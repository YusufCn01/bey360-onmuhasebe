import { EInvoiceDocumentStatus, EInvoiceScenario, InvoiceDirection, InvoiceStatus, ReminderChannel, ReminderStatus, SalesInvoiceKind } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getNextDocumentNumber } from "@/lib/business/documents";
import { db } from "@/lib/db";
import { buildPreliminaryUblXml } from "@/lib/einvoice-ubl";
import { getGibUserList, sendInvoiceToHizliBilisim } from "@/lib/integrations/hizli-bilisim";
import { getMobileTenantContext } from "@/lib/mobile-session";

type MobileInvoiceItemInput = {
  productId?: unknown;
  quantity?: unknown;
  unitPrice?: unknown;
  vatRate?: unknown;
  discountAmount?: unknown;
};

function isNotEInvoiceTaxpayer(note: string | null | undefined) {
  const normalized = (note ?? "").toLocaleLowerCase("tr-TR");
  return normalized.includes("mükellefi değil") || normalized.includes("mukellefi degil");
}

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function nextCode(prefix: string, countPromise: Promise<number>) {
  const count = await countPromise;
  return `${prefix}${String(count + 1).padStart(5, "0")}`;
}

function normalizeMobileInvoiceItems(payloadItems: unknown, fallbackProductId: string, fallbackQuantity: number) {
  const rawItems = Array.isArray(payloadItems) ? payloadItems : [];
  const items = rawItems
    .map((item) => ({
      productId: safeText((item as MobileInvoiceItemInput)?.productId),
      quantity: Math.max(0, safeNumber((item as MobileInvoiceItemInput)?.quantity, 0)),
      unitPrice: Math.max(0, safeNumber((item as MobileInvoiceItemInput)?.unitPrice, 0)),
      vatRate: Math.max(0, safeNumber((item as MobileInvoiceItemInput)?.vatRate, 0)),
      discountAmount: Math.max(0, safeNumber((item as MobileInvoiceItemInput)?.discountAmount, 0)),
    }))
    .filter((item) => item.productId && item.quantity > 0);

  if (items.length > 0) {
    return items;
  }

  if (fallbackProductId) {
    return [{
      productId: fallbackProductId,
      quantity: Math.max(1, fallbackQuantity || 1),
      unitPrice: 0,
      vatRate: 0,
      discountAmount: 0,
    }];
  }

  return [];
}

export async function POST(request: NextRequest) {
  const context = await getMobileTenantContext(request);
  if (!context) {
    return NextResponse.json({ success: false, error: { message: "Mobil oturum geçersiz." } }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        action?: string;
        payload?: Record<string, unknown>;
      }
    | null;

  const action = safeText(body?.action);
  const payload = body?.payload ?? {};

  try {
    if (action === "createCustomer") {
      const name = safeText(payload.name);
      const phone = safeText(payload.phone) || null;
      const taxNumber = safeText(payload.taxNumber) || null;
      const city = safeText(payload.city) || null;
      const code = safeText(payload.code) || (await nextCode("CR-", db.customer.count({ where: { tenantId: context.tenant.id } })));

      if (!name) {
        return NextResponse.json({ success: false, error: { message: "Müşteri adı zorunludur." } }, { status: 422 });
      }

      const customer = await db.customer.create({
        data: {
          tenantId: context.tenant.id,
          code,
          name,
          type: "CORPORATE",
          title: name,
          phone,
          taxNumber,
          city,
        },
      });

      return NextResponse.json({ success: true, data: customer });
    }

    if (action === "createSupplier") {
      const name = safeText(payload.name);
      const phone = safeText(payload.phone) || null;
      const taxNumber = safeText(payload.taxNumber) || null;
      const city = safeText(payload.city) || null;
      const code = safeText(payload.code) || (await nextCode("TD-", db.supplier.count({ where: { tenantId: context.tenant.id } })));

      if (!name) {
        return NextResponse.json({ success: false, error: { message: "Tedarikçi adı zorunludur." } }, { status: 422 });
      }

      const supplier = await db.supplier.create({
        data: {
          tenantId: context.tenant.id,
          code,
          name,
          phone,
          taxNumber,
          city,
        },
      });

      return NextResponse.json({ success: true, data: supplier });
    }

    if (action === "createProduct") {
      const name = safeText(payload.name);
      const kind = safeText(payload.kind) === "SERVICE" ? "SERVICE" : "PRODUCT";
      const salePrice = safeNumber(payload.salePrice, 0);
      const stockQty = kind === "SERVICE" ? 0 : safeNumber(payload.stockQty, 0);
      const vatRate = safeNumber(payload.vatRate, 20);
      const code = safeText(payload.code) || (await nextCode("UR-", db.product.count({ where: { tenantId: context.tenant.id } })));

      if (!name) {
        return NextResponse.json({ success: false, error: { message: "Ürün veya hizmet adı zorunludur." } }, { status: 422 });
      }

      const product = await db.product.create({
        data: {
          tenantId: context.tenant.id,
          code,
          name,
          kind,
          salePrice,
          purchasePrice: safeNumber(payload.purchasePrice, salePrice),
          stockQty,
          vatRate,
          unit: kind === "SERVICE" ? "Hizmet" : "Adet",
          category: safeText(payload.category) || null,
        },
      });

      return NextResponse.json({ success: true, data: product });
    }

    if (action === "createSalesInvoice") {
      const customerId = safeText(payload.customerId);
      const productId = safeText(payload.productId);
      const quantity = safeNumber(payload.quantity, 1);
      const items = normalizeMobileInvoiceItems(payload.items, productId, quantity);
      const issueDate = safeText(payload.issueDate);
      const deliveryDate = safeText(payload.deliveryDate);
      const dueDate = safeText(payload.dueDate);
      const currencyCode = safeText(payload.currencyCode) || "TRY";
      const note = safeText(payload.note) || null;
      const salesInvoiceKind = safeText(payload.salesInvoiceKind) === "WHOLESALE" ? SalesInvoiceKind.WHOLESALE : SalesInvoiceKind.RETAIL;

      if (!customerId || items.length === 0) {
        return NextResponse.json({ success: false, error: { message: "Müşteri ve en az bir ürün seçmelisiniz." } }, { status: 422 });
      }

      const productIds = [...new Set(items.map((item) => item.productId))];
      const [customer, products] = await Promise.all([
        db.customer.findFirst({ where: { id: customerId, tenantId: context.tenant.id } }),
        db.product.findMany({ where: { tenantId: context.tenant.id, id: { in: productIds } } }),
      ]);

      if (!customer || products.length === 0) {
        return NextResponse.json({ success: false, error: { message: "Seçilen müşteri veya ürün bulunamadı." } }, { status: 404 });
      }

      const productMap = new Map(products.map((item) => [item.id, item]));
      const normalizedItems = items.map((item, index) => {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`Kalem #${index + 1} için geçerli bir ürün bulunamadı.`);
        }

        const unitPrice = item.unitPrice > 0 ? item.unitPrice : Number(product.salePrice);
        const vatRate = item.vatRate > 0 ? item.vatRate : Number(product.vatRate);
        const grossSubtotal = item.quantity * unitPrice;
        const subtotal = Math.max(0, grossSubtotal - item.discountAmount);
        const vatTotal = subtotal * (vatRate / 100);
        return {
          productId: product.id,
          description: product.name,
          quantity: item.quantity,
          unitPrice,
          vatRate,
          withholdingRate: 0,
          withholdingAmount: 0,
          subtotal,
          vatTotal,
          lineTotal: subtotal + vatTotal,
        };
      });

      const subtotal = normalizedItems.reduce((sum, item) => sum + item.subtotal, 0);
      const vatTotal = normalizedItems.reduce((sum, item) => sum + item.vatTotal, 0);
      const grandTotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const invoiceNo = await getNextDocumentNumber(context.tenant.id, "SALES_INVOICE");

      const invoice = await db.invoice.create({
        data: {
          tenantId: context.tenant.id,
          branchId: context.membership.branchId,
          customerId: customer.id,
          invoiceNo,
          direction: InvoiceDirection.SALES,
          status: InvoiceStatus.ISSUED,
          issueDate: issueDate ? new Date(issueDate) : new Date(),
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          dueDate: dueDate ? new Date(dueDate) : null,
          currencyCode,
          salesInvoiceKind,
          subtotal,
          vatTotal,
          withholdingTotal: 0,
          grandTotal,
          paidTotal: 0,
          note,
          items: {
            create: normalizedItems.map((item) => ({
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              vatRate: item.vatRate,
              withholdingRate: item.withholdingRate,
              withholdingAmount: item.withholdingAmount,
              lineTotal: item.lineTotal,
            })),
          },
        },
      });

      await db.customer.update({
        where: { id: customer.id },
        data: { currentDebt: { increment: grandTotal } },
      });

      return NextResponse.json({ success: true, data: invoice });
    }

    if (action === "createPurchaseInvoice") {
      const supplierId = safeText(payload.supplierId);
      const productId = safeText(payload.productId);
      const quantity = safeNumber(payload.quantity, 1);
      const items = normalizeMobileInvoiceItems(payload.items, productId, quantity);
      const issueDate = safeText(payload.issueDate);
      const deliveryDate = safeText(payload.deliveryDate);
      const dueDate = safeText(payload.dueDate);
      const currencyCode = safeText(payload.currencyCode) || "TRY";
      const note = safeText(payload.note) || null;

      if (!supplierId || items.length === 0) {
        return NextResponse.json({ success: false, error: { message: "Tedarikçi ve en az bir ürün seçmelisiniz." } }, { status: 422 });
      }

      const productIds = [...new Set(items.map((item) => item.productId))];
      const [supplier, products] = await Promise.all([
        db.supplier.findFirst({ where: { id: supplierId, tenantId: context.tenant.id } }),
        db.product.findMany({ where: { tenantId: context.tenant.id, id: { in: productIds } } }),
      ]);

      if (!supplier || products.length === 0) {
        return NextResponse.json({ success: false, error: { message: "Seçilen tedarikçi veya ürün bulunamadı." } }, { status: 404 });
      }

      const productMap = new Map(products.map((item) => [item.id, item]));
      const normalizedItems = items.map((item, index) => {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`Kalem #${index + 1} için geçerli bir ürün bulunamadı.`);
        }

        const unitPrice = item.unitPrice > 0 ? item.unitPrice : Number(product.purchasePrice || product.salePrice || 0);
        const vatRate = item.vatRate > 0 ? item.vatRate : Number(product.vatRate);
        const grossSubtotal = item.quantity * unitPrice;
        const subtotal = Math.max(0, grossSubtotal - item.discountAmount);
        const vatTotal = subtotal * (vatRate / 100);
        return {
          productId: product.id,
          description: product.name,
          quantity: item.quantity,
          unitPrice,
          vatRate,
          withholdingRate: 0,
          withholdingAmount: 0,
          subtotal,
          vatTotal,
          lineTotal: subtotal + vatTotal,
        };
      });

      const subtotal = normalizedItems.reduce((sum, item) => sum + item.subtotal, 0);
      const vatTotal = normalizedItems.reduce((sum, item) => sum + item.vatTotal, 0);
      const grandTotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const invoiceNo = await getNextDocumentNumber(context.tenant.id, "PURCHASE_INVOICE");

      const invoice = await db.invoice.create({
        data: {
          tenantId: context.tenant.id,
          branchId: context.membership.branchId,
          supplierId: supplier.id,
          invoiceNo,
          direction: InvoiceDirection.PURCHASE,
          status: InvoiceStatus.ISSUED,
          issueDate: issueDate ? new Date(issueDate) : new Date(),
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          dueDate: dueDate ? new Date(dueDate) : null,
          currencyCode,
          subtotal,
          vatTotal,
          withholdingTotal: 0,
          grandTotal,
          paidTotal: 0,
          note,
          items: {
            create: normalizedItems.map((item) => ({
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              vatRate: item.vatRate,
              withholdingRate: item.withholdingRate,
              withholdingAmount: item.withholdingAmount,
              lineTotal: item.lineTotal,
            })),
          },
        },
      });

      await db.payment.create({
        data: {
          tenantId: context.tenant.id,
          invoiceId: invoice.id,
          direction: "OUT",
          method: "BANK",
          amount: 0,
          description: "Mobil alış faturası oluşturuldu",
        },
      });

      return NextResponse.json({ success: true, data: invoice });
    }

    if (action === "createExpense") {
      const title = safeText(payload.title);
      const category = safeText(payload.category) || "Genel";
      const amount = safeNumber(payload.amount, 0);

      if (!title || amount <= 0) {
        return NextResponse.json({ success: false, error: { message: "Gider başlığı ve tutarı zorunludur." } }, { status: 422 });
      }

      const expense = await db.expenseRecord.create({
        data: {
          tenantId: context.tenant.id,
          title,
          category,
          amount,
          transactionAt: new Date(),
          note: safeText(payload.note) || null,
        },
      });

      return NextResponse.json({ success: true, data: expense });
    }

    if (action === "createReminder") {
      const title = safeText(payload.title);
      const message = safeText(payload.message) || null;
      const dueAt = safeText(payload.dueAt);

      if (!title || !dueAt) {
        return NextResponse.json({ success: false, error: { message: "Hatırlatma başlığı ve tarihi zorunludur." } }, { status: 422 });
      }

      const reminder = await db.reminder.create({
        data: {
          tenantId: context.tenant.id,
          title,
          message,
          dueAt: new Date(dueAt),
          status: ReminderStatus.OPEN,
          channel: ReminderChannel.IN_APP,
          isRead: false,
        },
      });

      return NextResponse.json({ success: true, data: reminder });
    }

    if (action === "createPayment") {
      const amount = safeNumber(payload.amount, 0);
      const direction = safeText(payload.direction) === "OUT" ? "OUT" : "IN";
      const description = safeText(payload.description) || (direction === "IN" ? "Mobil tahsilat" : "Mobil ödeme");

      if (amount <= 0) {
        return NextResponse.json({ success: false, error: { message: "Tahsilat / ödeme tutarı zorunludur." } }, { status: 422 });
      }

      const payment = await db.payment.create({
        data: {
          tenantId: context.tenant.id,
          direction,
          method: "BANK",
          amount,
          description,
        },
      });

      return NextResponse.json({ success: true, data: payment });
    }

    if (action === "sendEDocument") {
      const documentId = safeText(payload.documentId);
      if (!documentId) {
        return NextResponse.json({ success: false, error: { message: "Gönderilecek belge seçilmelidir." } }, { status: 422 });
      }

      const document = await db.eInvoiceDocument.findFirst({
        where: { id: documentId, tenantId: context.tenant.id },
        include: {
          invoice: {
            include: {
              items: { include: { product: true } },
              customer: true,
              supplier: true,
              branch: true,
            },
          },
          tenant: true,
        },
      });

      if (!document) {
        return NextResponse.json({ success: false, error: { message: "E-belge kaydı bulunamadı." } }, { status: 404 });
      }

      const settings = await db.eInvoiceSettings.findUnique({ where: { tenantId: context.tenant.id } });
      if (!settings || settings.provider === "NONE") {
        return NextResponse.json({ success: false, error: { message: "Önce e-Dönüşüm sağlayıcısını yapılandırın." } }, { status: 422 });
      }

      try {
        if (settings.provider === "HIZLI_BILISIM") {
          let workingDocument = document;
          const taxNumber = workingDocument.invoice.customer?.taxNumber?.trim();

          if (taxNumber && taxNumber.length >= 10) {
            let matchedAlias = "";
            let taxpayer = false;
            let aliasNote: string | null | undefined = null;

            const manualAlias = workingDocument.invoice.customer?.eInvoiceAlias?.trim();
            if (workingDocument.invoice.customer?.eInvoiceRegistered && manualAlias) {
              matchedAlias = manualAlias;
              taxpayer = true;
              aliasNote = "Manuel doğrulama ile e-Fatura olarak işaretlendi.";
            } else {
              const lookup = await getGibUserList(settings, taxNumber, "PK", 1);
              matchedAlias = lookup.success ? lookup.users[0]?.Alias ?? "" : "";
              taxpayer = Boolean(matchedAlias);
              aliasNote = lookup.note;

              if (!taxpayer) {
                const gbLookup = await getGibUserList(settings, taxNumber, "GB", 1);
                const gbAlias = gbLookup.success ? gbLookup.users[0]?.Alias ?? "" : "";
                if (gbAlias) {
                  matchedAlias = gbAlias;
                  taxpayer = true;
                  aliasNote = `GB alias kullanıldı: ${gbAlias}`;
                } else if (!gbLookup.success && gbLookup.note) {
                  aliasNote = gbLookup.note;
                }
              }
            }

            const notTaxpayer = isNotEInvoiceTaxpayer(aliasNote ?? "");
            if (!taxpayer && !notTaxpayer && !aliasNote) {
              return NextResponse.json({ success: false, error: { message: aliasNote || "Alıcı e-Fatura durumu doğrulanamadı." } }, { status: 502 });
            }

            if (workingDocument.invoice.customerId) {
              await db.customer.update({
                where: { id: workingDocument.invoice.customerId },
                data: {
                  eInvoiceRegistered: taxpayer,
                  eInvoiceAlias: taxpayer ? matchedAlias : null,
                  eInvoiceCheckNote: taxpayer ? `e-Fatura mükellefi · alias: ${matchedAlias}` : aliasNote,
                  eInvoiceCheckedAt: new Date(),
                },
              });
            }

            if (taxpayer && workingDocument.scenario === EInvoiceScenario.E_ARCHIVE) {
              const upgradedDocument = await db.eInvoiceDocument.update({
                where: { id: workingDocument.id },
                data: {
                  scenario: EInvoiceScenario.E_INVOICE_BASIC,
                  status: EInvoiceDocumentStatus.READY,
                  destinationUrn: matchedAlias,
                  responseNote: "Alıcı e-Fatura mükellefi olduğu için belge e-Fatura olarak hazırlandı.",
                },
              });
              workingDocument = { ...workingDocument, ...upgradedDocument };
            }

            if (!taxpayer && workingDocument.scenario !== EInvoiceScenario.E_ARCHIVE && settings.archiveEnabled) {
              const downgradedDocument = await db.eInvoiceDocument.update({
                where: { id: workingDocument.id },
                data: {
                  scenario: EInvoiceScenario.E_ARCHIVE,
                  status: EInvoiceDocumentStatus.READY,
                  destinationUrn: null,
                  responseNote: "Alıcı e-Fatura mükellefi olmadığı için belge e-Arşiv olarak yeniden hazırlanıyor.",
                },
              });
              workingDocument = { ...workingDocument, ...downgradedDocument };
            }
          }

          let xmlContent = buildPreliminaryUblXml({
            tenant: workingDocument.tenant,
            settings,
            document: workingDocument,
            invoice: workingDocument.invoice,
          });

          let result = await sendInvoiceToHizliBilisim({
            tenant: workingDocument.tenant,
            settings,
            document: workingDocument,
            invoice: workingDocument.invoice,
            xmlContent,
          });

          if (
            !result.success &&
            workingDocument.scenario !== EInvoiceScenario.E_ARCHIVE &&
            settings.archiveEnabled &&
            isNotEInvoiceTaxpayer(result.note)
          ) {
            if (workingDocument.invoice.customerId) {
              await db.customer.update({
                where: { id: workingDocument.invoice.customerId },
                data: {
                  eInvoiceRegistered: false,
                  eInvoiceAlias: null,
                  eInvoiceCheckNote: result.note,
                  eInvoiceCheckedAt: new Date(),
                },
              });
            }

            const downgradedDocument = await db.eInvoiceDocument.update({
              where: { id: workingDocument.id },
              data: {
                scenario: EInvoiceScenario.E_ARCHIVE,
                status: EInvoiceDocumentStatus.READY,
                destinationUrn: null,
                responseNote: "Alıcı e-Fatura mükellefi olmadığı için belge e-Arşiv olarak yeniden hazırlanıyor.",
              },
            });

            workingDocument = { ...workingDocument, ...downgradedDocument };

            xmlContent = buildPreliminaryUblXml({
              tenant: workingDocument.tenant,
              settings,
              document: workingDocument,
              invoice: workingDocument.invoice,
            });

            result = await sendInvoiceToHizliBilisim({
              tenant: workingDocument.tenant,
              settings,
              document: workingDocument,
              invoice: workingDocument.invoice,
              xmlContent,
            });
          }

          const updated = await db.eInvoiceDocument.update({
            where: { id: workingDocument.id },
            data: {
              status: result.success ? EInvoiceDocumentStatus.SENT : EInvoiceDocumentStatus.FAILED,
              scenario: workingDocument.scenario,
              externalId: result.externalId ?? workingDocument.externalId,
              envelopeUuid: result.envelopeUuid ?? workingDocument.envelopeUuid,
              sourceUrn: result.sourceUrn ?? workingDocument.sourceUrn,
              destinationUrn: result.destinationUrn ?? workingDocument.destinationUrn,
              responseNote: result.note,
            },
          });

          return result.success
            ? NextResponse.json({ success: true, data: updated })
            : NextResponse.json({ success: false, error: { message: result.note }, data: updated }, { status: 502 });
        }

        const updated = await db.eInvoiceDocument.update({
          where: { id: document.id },
          data: {
            status: EInvoiceDocumentStatus.SENT,
            externalId: `GIB-${Date.now()}`,
            envelopeUuid: crypto.randomUUID(),
            responseNote: "GİB e-Arşiv gönderimi demo modda başarılı.",
          },
        });

        return NextResponse.json({ success: true, data: updated });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Belge gönderimi sırasında beklenmeyen bir hata oluştu.";
        await db.eInvoiceDocument.update({
          where: { id: document.id },
          data: { status: EInvoiceDocumentStatus.FAILED, responseNote: message },
        });
        return NextResponse.json({ success: false, error: { message } }, { status: 502 });
      }
    }

    return NextResponse.json({ success: false, error: { message: "Desteklenmeyen mobil işlem." } }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : "Mobil işlem tamamlanamadı." },
      },
      { status: 422 },
    );
  }
}

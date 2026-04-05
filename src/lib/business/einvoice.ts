import { Customer, EInvoiceDocumentStatus, EInvoiceProvider, EInvoiceScenario, InvoiceDirection } from "@prisma/client";
import { db } from "@/lib/db";

export function resolveScenario(direction: InvoiceDirection, customer?: Pick<Customer, "taxNumber" | "eInvoiceRegistered" | "eInvoiceAlias"> | null) {
  if (direction !== InvoiceDirection.SALES) {
    return null;
  }

  if (customer?.eInvoiceRegistered && customer.taxNumber && customer.taxNumber.length >= 10) {
    return EInvoiceScenario.E_INVOICE_BASIC;
  }

  return EInvoiceScenario.E_ARCHIVE;
}

export async function ensureEInvoiceDraft(invoiceId: string, tenantId: string) {
  const [invoice, settings] = await Promise.all([
    db.invoice.findFirst({ where: { id: invoiceId, tenantId }, include: { customer: true } }),
    db.eInvoiceSettings.findUnique({ where: { tenantId } }),
  ]);

  if (!invoice) {
    return null;
  }

  const scenario = resolveScenario(invoice.direction, invoice.customer);
  if (!scenario) {
    return null;
  }

  const provider = settings?.provider ?? EInvoiceProvider.NONE;
  const status = provider === EInvoiceProvider.NONE ? EInvoiceDocumentStatus.DRAFT : EInvoiceDocumentStatus.READY;

  return db.eInvoiceDocument.upsert({
    where: { invoiceId: invoice.id },
    update: {
      provider,
      scenario,
      status,
      responseNote: provider === EInvoiceProvider.NONE ? "Servis ayarı bekleniyor" : scenario === EInvoiceScenario.E_ARCHIVE ? "e-Arşiv gönderimine hazır" : "e-Fatura gönderimine hazır",
    },
    create: {
      tenantId,
      invoiceId: invoice.id,
      provider,
      scenario,
      status,
      responseNote: provider === EInvoiceProvider.NONE ? "Servis ayarı bekleniyor" : scenario === EInvoiceScenario.E_ARCHIVE ? "e-Arşiv gönderimine hazır" : "e-Fatura gönderimine hazır",
    },
  });
}

import { notFound } from "next/navigation";
import { DocumentTemplateRenderer } from "@/components/documents/document-template-renderer";
import { PreviewToolbar } from "@/components/documents/preview-toolbar";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { getDefaultDocumentTemplate } from "@/lib/document-template-service";
import { formatDate } from "@/lib/format";

export default async function InvoiceTemplatePreviewPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { tenant } = await getTenantContext();
  const { invoiceId } = await params;

  const [invoice, template] = await Promise.all([
    db.invoice.findFirst({ where: { id: invoiceId, tenantId: tenant.id }, include: { customer: true, supplier: true, items: { include: { product: true } } } }),
    getDefaultDocumentTemplate(tenant.id, "INVOICE"),
  ]);

  if (!invoice || !template) notFound();

  return (
    <>
      <PreviewToolbar
        backHref={invoice.direction === "SALES" ? "/panel/satis-faturalari" : "/panel/alis-faturalari"}
        documentTitle={`${invoice.direction === "SALES" ? "Fatura" : "Alış Faturası"} ${invoice.invoiceNo}`}
      />
      <DocumentTemplateRenderer
        kind="INVOICE"
        contentJson={template.contentJson}
        payload={{
          kind: "INVOICE",
          title: invoice.direction === "SALES" ? "Fatura" : "Alış Faturası",
          documentNo: invoice.invoiceNo,
          issueDate: formatDate(invoice.issueDate),
          dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : null,
          currencyCode: invoice.currencyCode,
          company: { name: tenant.name, taxNumber: tenant.taxNumber, address: tenant.address, city: tenant.city, district: tenant.district, phone: tenant.phone, email: tenant.email, logoUrl: tenant.logoUrl, secondaryLogoUrl: tenant.secondaryLogoUrl, signatureImageUrl: tenant.signatureImageUrl, stampImageUrl: tenant.stampImageUrl, signatureName: tenant.signatureName, signatureTitle: tenant.signatureTitle },
          recipient: { name: invoice.customer?.name ?? invoice.supplier?.name ?? "Genel Kayıt", taxNumber: invoice.customer?.taxNumber ?? null, address: invoice.customer?.address ?? null, city: invoice.customer?.city ?? invoice.supplier?.city ?? null, district: invoice.customer?.district ?? null, phone: invoice.customer?.phone ?? invoice.supplier?.phone ?? null, email: invoice.customer?.email ?? invoice.supplier?.email ?? null },
          lines: invoice.items.map((item) => ({ code: item.product?.code ?? "-", name: item.description, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice), lineTotal: Number(item.lineTotal) })),
          subtotal: Number(invoice.subtotal),
          vatTotal: Number(invoice.vatTotal),
          grandTotal: Number(invoice.grandTotal),
          note: invoice.note,
        }}
      />
    </>
  );
}

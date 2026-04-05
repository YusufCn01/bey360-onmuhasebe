import { notFound } from "next/navigation";
import { DocumentTemplateRenderer } from "@/components/documents/document-template-renderer";
import { PreviewToolbar } from "@/components/documents/preview-toolbar";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { getDefaultDocumentTemplate } from "@/lib/document-template-service";
import { formatDate } from "@/lib/format";

export default async function QuoteTemplatePreviewPage({ params }: { params: Promise<{ quoteId: string }> }) {
  const { tenant } = await getTenantContext();
  const { quoteId } = await params;

  const [quote, template] = await Promise.all([
    db.quote.findFirst({ where: { id: quoteId, tenantId: tenant.id }, include: { customer: true, items: { include: { product: true } } } }),
    getDefaultDocumentTemplate(tenant.id, "QUOTE"),
  ]);

  if (!quote || !template) notFound();

  return (
    <>
      <PreviewToolbar backHref="/panel/teklifler" documentTitle={`Teklif ${quote.quoteNo}`} />
      <DocumentTemplateRenderer
        kind="QUOTE"
        contentJson={template.contentJson}
        payload={{
          kind: "QUOTE",
          title: "Teklif",
          documentNo: quote.quoteNo,
          issueDate: formatDate(quote.issueDate),
          dueDate: quote.validUntil ? formatDate(quote.validUntil) : null,
          currencyCode: "TRY",
          company: { name: tenant.name, taxNumber: tenant.taxNumber, address: tenant.address, city: tenant.city, district: tenant.district, phone: tenant.phone, email: tenant.email, logoUrl: tenant.logoUrl, secondaryLogoUrl: tenant.secondaryLogoUrl, signatureImageUrl: tenant.signatureImageUrl, stampImageUrl: tenant.stampImageUrl, signatureName: tenant.signatureName, signatureTitle: tenant.signatureTitle },
          recipient: { name: quote.customer?.name ?? "Genel Kayıt", taxNumber: quote.customer?.taxNumber ?? null, address: quote.customer?.address ?? null, city: quote.customer?.city ?? null, district: quote.customer?.district ?? null, phone: quote.customer?.phone ?? null, email: quote.customer?.email ?? null },
          lines: quote.items.map((item) => ({ code: item.product?.code ?? "-", name: item.description, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice), lineTotal: Number(item.lineTotal) })),
          subtotal: Number(quote.subtotal),
          vatTotal: Number(quote.vatTotal),
          grandTotal: Number(quote.grandTotal),
          note: quote.note,
        }}
      />
    </>
  );
}

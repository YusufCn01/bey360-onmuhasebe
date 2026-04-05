import { notFound } from "next/navigation";
import { DocumentTemplateRenderer } from "@/components/documents/document-template-renderer";
import { PreviewToolbar } from "@/components/documents/preview-toolbar";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { getDefaultDocumentTemplate } from "@/lib/document-template-service";
import { formatDate } from "@/lib/format";

export default async function DispatchTemplatePreviewPage({ params }: { params: Promise<{ dispatchNoteId: string }> }) {
  const { tenant } = await getTenantContext();
  const { dispatchNoteId } = await params;

  const [dispatchNote, template] = await Promise.all([
    db.dispatchNote.findFirst({ where: { id: dispatchNoteId, tenantId: tenant.id }, include: { customer: true, items: { include: { product: true } }, invoice: true } }),
    getDefaultDocumentTemplate(tenant.id, "DISPATCH"),
  ]);

  if (!dispatchNote || !template) notFound();
  const noteParts = [dispatchNote.note, dispatchNote.invoice ? `Bağlı fatura: ${dispatchNote.invoice.invoiceNo}` : null];

  return (
    <>
      <PreviewToolbar backHref="/panel/irsaliyeler" documentTitle={`İrsaliye ${dispatchNote.dispatchNo}`} />
      <DocumentTemplateRenderer
        kind="DISPATCH"
        contentJson={template.contentJson}
        payload={{
          kind: "DISPATCH",
          title: "İrsaliye",
          documentNo: dispatchNote.dispatchNo,
          issueDate: formatDate(dispatchNote.issueDate),
          dueDate: dispatchNote.deliveryDate ? formatDate(dispatchNote.deliveryDate) : null,
          currencyCode: dispatchNote.currencyCode,
          company: { name: tenant.name, taxNumber: tenant.taxNumber, address: tenant.address, city: tenant.city, district: tenant.district, phone: tenant.phone, email: tenant.email, logoUrl: tenant.logoUrl, secondaryLogoUrl: tenant.secondaryLogoUrl, signatureImageUrl: tenant.signatureImageUrl, stampImageUrl: tenant.stampImageUrl, signatureName: tenant.signatureName, signatureTitle: tenant.signatureTitle },
          recipient: { name: dispatchNote.customer?.name ?? "Genel Kayıt", taxNumber: dispatchNote.customer?.taxNumber ?? null, address: dispatchNote.customer?.address ?? null, city: dispatchNote.customer?.city ?? null, district: dispatchNote.customer?.district ?? null, phone: dispatchNote.customer?.phone ?? null, email: dispatchNote.customer?.email ?? null },
          lines: dispatchNote.items.map((item) => ({ code: item.product?.code ?? "-", name: item.description, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice), lineTotal: Number(item.lineTotal) })),
          subtotal: Number(dispatchNote.subtotal),
          vatTotal: Number(dispatchNote.vatTotal),
          grandTotal: Number(dispatchNote.grandTotal),
          note: noteParts.filter(Boolean).join("\n"),
        }}
      />
    </>
  );
}

import { NextResponse } from "next/server";
import { buildPreliminaryUblXml } from "@/lib/einvoice-ubl";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

export async function GET(_: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const { documentId } = await params;
  const document = await db.eInvoiceDocument.findFirst({
    where: { id: documentId, tenantId: context.tenant.id },
    include: {
      invoice: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
          supplier: true,
          branch: true,
        },
      },
      tenant: true,
    },
  });

  if (!document) {
    return NextResponse.json({ success: false, error: "e-Belge kaydı bulunamadı." }, { status: 404 });
  }

  const settings = await db.eInvoiceSettings.findUnique({ where: { tenantId: context.tenant.id } });
  const xml = buildPreliminaryUblXml({
    tenant: document.tenant,
    settings,
    document,
    invoice: document.invoice,
  });

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${document.invoice.invoiceNo}.xml"`,
    },
  });
}

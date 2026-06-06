import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMobileTenantContext } from "@/lib/mobile-session";

export async function GET(request: NextRequest, context: { params: Promise<{ invoiceId: string }> }) {
  const mobileContext = await getMobileTenantContext(request);
  if (!mobileContext) {
    return NextResponse.json({ success: false, error: { message: "Mobil oturum geçersiz." } }, { status: 401 });
  }

  const { invoiceId } = await context.params;

  const invoice = await db.invoice.findFirst({
    where: {
      id: invoiceId,
      tenantId: mobileContext.tenant.id,
    },
    include: {
      supplier: true,
      customer: true,
      items: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ success: false, error: { message: "Fatura bulunamadı." } }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      supplierName: invoice.supplier?.name ?? invoice.customer?.name ?? null,
      issueDate: invoice.issueDate.toISOString(),
      currencyCode: invoice.currencyCode,
      subtotal: invoice.subtotal,
      vatTotal: invoice.vatTotal,
      grandTotal: invoice.grandTotal,
      status: invoice.status,
      note: invoice.note,
      items: invoice.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        lineTotal: item.lineTotal,
      })),
    },
  });
}
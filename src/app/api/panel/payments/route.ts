import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { PaymentDirection, PaymentMethod } from "@prisma/client";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { direction?: PaymentDirection; method?: PaymentMethod; amount?: string; invoiceId?: string; description?: string }
    | null;

  const amount = Number(body?.amount ?? 0);
  if (amount <= 0) {
    return NextResponse.json({ success: false, error: "Tutar sıfırdan büyük olmalıdır." }, { status: 422 });
  }

  const payment = await db.payment.create({
    data: {
      tenantId: context.tenant.id,
      invoiceId: body?.invoiceId || null,
      direction: body?.direction === PaymentDirection.OUT ? PaymentDirection.OUT : PaymentDirection.IN,
      method: body?.method ?? PaymentMethod.BANK,
      amount,
      description: body?.description?.trim() || null,
    },
  });

  if (body?.invoiceId) {
    const invoice = await db.invoice.findFirst({ where: { id: body.invoiceId, tenantId: context.tenant.id } });
    if (invoice) {
      const paidTotal = Number(invoice.paidTotal) + (payment.direction === PaymentDirection.IN ? amount : 0);
      await db.invoice.update({
        where: { id: invoice.id },
        data: {
          paidTotal,
          status: paidTotal >= Number(invoice.grandTotal) ? "PAID" : paidTotal > 0 ? "PARTIAL" : invoice.status,
        },
      });
    }
  }

  revalidatePath("/panel/finans");
  revalidatePath("/panel/faturalar");
  revalidatePath("/panel");
  return NextResponse.json({ success: true, data: payment });
}

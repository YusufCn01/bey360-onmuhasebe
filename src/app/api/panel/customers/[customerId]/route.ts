import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { buildCustomerDisplayName, buildCustomerWriteData, normalizeCustomerType, type CustomerPayload } from "@/lib/customer-utils";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  const context = await getTenantRouteContext();
  if (!context) return NextResponse.json({ success: false, error: "Bu i?lem i?in giri? yapmal?s?n?z." }, { status: 403 });

  const { customerId } = await params;
  const existing = await db.customer.findFirst({ where: { id: customerId, tenantId: context.tenant.id } });
  if (!existing) return NextResponse.json({ success: false, error: "M??teri bulunamad?." }, { status: 404 });

  const body = (await request.json().catch(() => null)) as CustomerPayload | null;
  const code = body?.code?.trim() ?? "";
  const type = normalizeCustomerType(body?.type);
  const name = buildCustomerDisplayName(body ?? {}, type);
  if (!code || !name) {
    return NextResponse.json({ success: false, error: "Cari kodu ve m??teri ad? veya ?nvan? zorunludur." }, { status: 422 });
  }

  const duplicate = await db.customer.findFirst({ where: { tenantId: context.tenant.id, code, id: { not: customerId } } });
  if (duplicate) return NextResponse.json({ success: false, error: "Bu cari kodu ba?ka bir m??teri taraf?ndan kullan?l?yor." }, { status: 409 });

  const writeData = buildCustomerWriteData(body ?? {});
  const customer = await db.customer.update({
    where: { id: customerId },
    data: {
      ...writeData,
      code,
      type,
      name,
      tenantId: existing.tenantId,
    },
  });

  revalidatePath("/panel/cari");
  revalidatePath("/panel");
  return NextResponse.json({ success: true, data: customer });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  const context = await getTenantRouteContext();
  if (!context) return NextResponse.json({ success: false, error: "Bu i?lem i?in giri? yapmal?s?n?z." }, { status: 403 });

  const { customerId } = await params;
  const customer = await db.customer.findFirst({ where: { id: customerId, tenantId: context.tenant.id }, include: { quotes: { take: 1 }, orders: { take: 1 }, invoices: { take: 1 } } });
  if (!customer) return NextResponse.json({ success: false, error: "M??teri bulunamad?." }, { status: 404 });
  if (customer.quotes.length || customer.orders.length || customer.invoices.length) {
    return NextResponse.json({ success: false, error: "Bu m??teri teklif, sipari? veya fatura ile ba?l? oldu?u i?in silinemez." }, { status: 409 });
  }

  await db.customer.delete({ where: { id: customerId } });
  revalidatePath("/panel/cari");
  revalidatePath("/panel");
  return NextResponse.json({ success: true });
}

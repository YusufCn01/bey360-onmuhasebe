import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { buildCustomerDisplayName, buildCustomerWriteData, normalizeCustomerType, type CustomerPayload } from "@/lib/customer-utils";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu i?lem i?in giri? yapmal?s?n?z." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as CustomerPayload | null;
  const code = body?.code?.trim() ?? "";
  const type = normalizeCustomerType(body?.type);
  const name = buildCustomerDisplayName(body ?? {}, type);

  if (!code || !name) {
    return NextResponse.json({ success: false, error: "Cari kodu ve m??teri ad? veya ?nvan? zorunludur." }, { status: 422 });
  }

  const exists = await db.customer.findFirst({ where: { tenantId: context.tenant.id, code } });
  if (exists) {
    return NextResponse.json({ success: false, error: "Bu cari kodu bu firmada zaten kullan?l?yor." }, { status: 409 });
  }

  const customer = await db.customer.create({
    data: {
      ...buildCustomerWriteData(body ?? {}),
      tenantId: context.tenant.id,
      code,
      type,
      name,
    },
  });

  revalidatePath("/panel/cari");
  revalidatePath("/panel");

  return NextResponse.json({ success: true, data: customer });
}

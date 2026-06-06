import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

function onlyDigits(value: string | null | undefined) {
  return String(value ?? "").replace(/\D/g, "");
}

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        taxNumber?: string;
        alias?: string;
        registered?: boolean;
      }
    | null;

  const taxNumber = onlyDigits(body?.taxNumber);
  if (!taxNumber) {
    return NextResponse.json({ success: false, error: "VKN/TCKN zorunludur." }, { status: 422 });
  }

  const registered = Boolean(body?.registered);
  const alias = body?.alias?.trim() || null;

  const updated = await db.customer.updateMany({
    where: { tenantId: context.tenant.id, taxNumber },
    data: {
      eInvoiceRegistered: registered,
      eInvoiceAlias: registered ? alias : null,
      eInvoiceCheckNote: registered ? "Manuel doğrulama" : "Manuel olarak e-Arşiv işaretlendi",
      eInvoiceCheckedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, data: { count: updated.count } });
}

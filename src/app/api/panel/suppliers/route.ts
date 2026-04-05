import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        code?: string;
        name?: string;
        phone?: string;
        email?: string;
        city?: string;
      }
    | null;

  const code = body?.code?.trim() ?? "";
  const name = body?.name?.trim() ?? "";

  if (!code || !name) {
    return NextResponse.json({ success: false, error: "Tedarikçi kodu ve firma adı zorunludur." }, { status: 422 });
  }

  const exists = await db.supplier.findFirst({ where: { tenantId: context.tenant.id, code } });
  if (exists) {
    return NextResponse.json({ success: false, error: "Bu tedarikçi kodu bu firmada zaten kullanılıyor." }, { status: 409 });
  }

  const supplier = await db.supplier.create({
    data: {
      tenantId: context.tenant.id,
      code,
      name,
      phone: body?.phone?.trim() || null,
      email: body?.email?.trim() || null,
      city: body?.city?.trim() || null,
    },
  });

  revalidatePath("/panel/cari");
  revalidatePath("/panel");

  return NextResponse.json({ success: true, data: supplier });
}

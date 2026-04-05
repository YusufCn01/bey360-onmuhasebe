import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { name?: string; code?: string; city?: string; district?: string; phone?: string } | null;
  const name = body?.name?.trim() ?? "";
  const code = body?.code?.trim().toUpperCase() ?? "";

  if (!name || !code) {
    return NextResponse.json({ success: false, error: "Şube adı ve şube kodu zorunludur." }, { status: 422 });
  }

  const exists = await db.branch.findFirst({ where: { tenantId: context.tenant.id, code } });
  if (exists) {
    return NextResponse.json({ success: false, error: "Bu şube kodu zaten kullanılıyor." }, { status: 409 });
  }

  const branch = await db.branch.create({
    data: {
      tenantId: context.tenant.id,
      name,
      code,
      city: body?.city?.trim() || null,
      district: body?.district?.trim() || null,
      phone: body?.phone?.trim() || null,
    },
  });

  revalidatePath("/panel/ayarlar/subeler");
  revalidatePath("/panel");
  return NextResponse.json({ success: true, data: branch });
}

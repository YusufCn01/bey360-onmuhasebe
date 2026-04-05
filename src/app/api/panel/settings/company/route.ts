import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        name?: string;
        taxNumber?: string;
        phone?: string;
        email?: string;
        city?: string;
        district?: string;
        address?: string;
        logoUrl?: string;
        secondaryLogoUrl?: string;
        signatureImageUrl?: string;
        stampImageUrl?: string;
        signatureName?: string;
        signatureTitle?: string;
      }
    | null;

  const name = body?.name?.trim() ?? "";
  if (!name) {
    return NextResponse.json({ success: false, error: "Firma adı zorunludur." }, { status: 422 });
  }

  const tenant = await db.tenant.update({
    where: { id: context.tenant.id },
    data: {
      name,
      taxNumber: body?.taxNumber?.trim() || null,
      phone: body?.phone?.trim() || null,
      email: body?.email?.trim() || null,
      logoUrl: body?.logoUrl?.trim() || null,
      secondaryLogoUrl: body?.secondaryLogoUrl?.trim() || null,
      signatureImageUrl: body?.signatureImageUrl?.trim() || null,
      stampImageUrl: body?.stampImageUrl?.trim() || null,
      signatureName: body?.signatureName?.trim() || null,
      signatureTitle: body?.signatureTitle?.trim() || null,
      city: body?.city?.trim() || null,
      district: body?.district?.trim() || null,
      address: body?.address?.trim() || null,
    },
  });

  revalidatePath("/panel/ayarlar/firma");
  revalidatePath("/panel");
  return NextResponse.json({ success: true, data: tenant });
}

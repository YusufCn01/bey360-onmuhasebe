import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

export async function PATCH(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: { message: "Geçerli bir oturum bulunamadı." } }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        fullName?: string;
        phone?: string;
        avatarUrl?: string;
      }
    | null;

  const fullName = body?.fullName?.trim() || "";
  const phone = body?.phone?.trim() || "";
  const avatarUrl = body?.avatarUrl?.trim() || "";

  if (!fullName) {
    return NextResponse.json({ success: false, error: { message: "Ad soyad alanı zorunludur." } }, { status: 422 });
  }

  const updatedUser = await db.user.update({
    where: { id: context.user.id },
    data: {
      fullName,
      phone: phone || null,
      avatarUrl: avatarUrl || null,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      id: updatedUser.id,
      fullName: updatedUser.fullName,
      phone: updatedUser.phone,
      email: updatedUser.email,
      avatarUrl: updatedUser.avatarUrl,
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function PATCH(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: { message: "Geçerli bir oturum bulunamadı." } }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        currentPassword?: string;
        newPassword?: string;
        confirmPassword?: string;
      }
    | null;

  const currentPassword = body?.currentPassword?.trim() || "";
  const newPassword = body?.newPassword?.trim() || "";
  const confirmPassword = body?.confirmPassword?.trim() || "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json({ success: false, error: { message: "Mevcut şifre ve yeni şifre alanları zorunludur." } }, { status: 422 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ success: false, error: { message: "Yeni şifre en az 8 karakter olmalıdır." } }, { status: 422 });
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ success: false, error: { message: "Yeni şifre tekrarı eşleşmiyor." } }, { status: 422 });
  }

  const isValid = await verifyPassword(currentPassword, context.user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ success: false, error: { message: "Mevcut şifre doğru değil." } }, { status: 422 });
  }

  await db.user.update({
    where: { id: context.user.id },
    data: {
      passwordHash: await hashPassword(newPassword),
    },
  });

  return NextResponse.json({ success: true });
}

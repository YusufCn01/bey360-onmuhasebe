import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSessionToken, verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = body?.email?.trim().toLowerCase() || "";
  const password = body?.password?.trim() || "";

  if (!email || !password) {
    return NextResponse.json({ success: false, error: { message: "E-posta ve şifre zorunludur." } }, { status: 422 });
  }

  const user = await db.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: { tenant: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ success: false, error: { message: "Kullanıcı bulunamadı veya pasif durumda." } }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ success: false, error: { message: "Şifre hatalı." } }, { status: 401 });
  }

  const membership = user.memberships[0] ?? null;
  const token = await createSessionToken({
    userId: user.id,
    tenantId: membership?.tenantId ?? null,
    membershipRole: membership?.role ?? null,
    globalRole: user.globalRole,
  });

  return NextResponse.json({
    success: true,
    data: {
      token,
      user: {
        email: user.email,
        fullName: user.fullName,
        globalRole: user.globalRole,
      },
    },
  });
}

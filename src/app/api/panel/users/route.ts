import { NextRequest, NextResponse } from "next/server";
import { MembershipRole } from "@prisma/client";
import { canManageTenantUsers } from "@/lib/access";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { getTenantRouteContext } from "@/lib/session-context";

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: { message: "Bu işlem için tenant oturumu gerekli." } }, { status: 403 });
  }

  if (!canManageTenantUsers(context.membership.role)) {
    return NextResponse.json({ success: false, error: { message: "Bu işlem için yönetici yetkisi gerekli." } }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        fullName?: string;
        email?: string;
        password?: string;
        role?: MembershipRole;
        phone?: string;
      }
    | null;

  const fullName = body?.fullName?.trim() || "";
  const email = body?.email?.trim().toLowerCase() || "";
  const password = body?.password?.trim() || "";
  const role = body?.role || MembershipRole.VIEWER;

  if (!fullName || !email || !password) {
    return NextResponse.json({ success: false, error: { message: "Ad soyad, e-posta ve şifre zorunludur." } }, { status: 422 });
  }

  const existingUser = await db.user.findUnique({
    where: { email },
    include: { memberships: true },
  });

  if (existingUser?.memberships.some((item) => item.tenantId === context.tenant.id)) {
    return NextResponse.json({ success: false, error: { message: "Bu kullanıcı tenant içinde zaten kayıtlı." } }, { status: 409 });
  }

  const user =
    existingUser ??
    (await db.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        fullName,
        phone: body?.phone?.trim() || null,
      },
    }));

  const createdMembership = await db.membership.create({
    data: {
      userId: user.id,
      tenantId: context.tenant.id,
      branchId: context.membership.branchId,
      role,
    },
  });

  return NextResponse.json({ success: true, data: { user, membership: createdMembership } });
}

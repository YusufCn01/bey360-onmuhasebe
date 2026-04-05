import { NextRequest, NextResponse } from "next/server";
import { MembershipRole, TenantStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { getFounderRouteContext } from "@/lib/session-context";
import { codeify, slugify } from "@/lib/text";

export async function POST(request: NextRequest) {
  const context = await getFounderRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: { message: "Bu işlem için kurucu oturumu gerekli." } }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        companyName?: string;
        ownerName?: string;
        ownerEmail?: string;
      ownerPassword?: string;
      phone?: string;
      city?: string;
      planName?: string;
      packagePlanId?: string;
      }
    | null;

  const companyName = body?.companyName?.trim() || "";
  const ownerName = body?.ownerName?.trim() || "";
  const ownerEmail = body?.ownerEmail?.trim().toLowerCase() || "";
  const ownerPassword = body?.ownerPassword?.trim() || "";
  const packagePlanId = body?.packagePlanId?.trim() || "";

  if (!companyName || !ownerName || !ownerEmail || !ownerPassword) {
    return NextResponse.json({ success: false, error: { message: "Firma adı, sahip adı, e-posta ve şifre zorunludur." } }, { status: 422 });
  }

  const existingUser = await db.user.findUnique({ where: { email: ownerEmail } });
  if (existingUser) {
    return NextResponse.json({ success: false, error: { message: "Bu e-posta ile kayıtlı bir kullanıcı zaten var." } }, { status: 409 });
  }

  const packagePlan = packagePlanId
    ? await db.packagePlan.findFirst({ where: { id: packagePlanId, isActive: true } })
    : null;

  const baseSlug = slugify(companyName);
  const baseCode = codeify(companyName);
  const tenantCount = await db.tenant.count();
  const slug = `${baseSlug || "tenant"}-${tenantCount + 1}`;
  const code = `${baseCode || "TENANT"}_${tenantCount + 1}`;

  const result = await db.$transaction(async (tx) => {
    const owner = await tx.user.create({
      data: {
        email: ownerEmail,
        passwordHash: await hashPassword(ownerPassword),
        fullName: ownerName,
        phone: body?.phone?.trim() || null,
      },
    });

    const tenant = await tx.tenant.create({
      data: {
        name: companyName,
        slug,
        code,
        phone: body?.phone?.trim() || null,
        city: body?.city?.trim() || null,
        status: TenantStatus.ACTIVE,
        planName: packagePlan?.name ?? "Profesyonel",
        packagePlanId: packagePlan?.id ?? null,
        createdByUserId: context.user.id,
      },
    });

    const branch = await tx.branch.create({
      data: {
        tenantId: tenant.id,
        name: "Merkez Şube",
        code: "MRK",
        city: body?.city?.trim() || null,
        isMain: true,
      },
    });

    await tx.membership.create({
      data: {
        userId: owner.id,
        tenantId: tenant.id,
        branchId: branch.id,
        role: MembershipRole.OWNER,
      },
    });

    return { owner, tenant, branch };
  });

  return NextResponse.json({ success: true, data: result });
}

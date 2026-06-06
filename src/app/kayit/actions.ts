"use server";

import { redirect } from "next/navigation";
import { MembershipRole, TenantStatus } from "@prisma/client";
import { clearLockCookie, createSessionToken, setSessionCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email-verification";
import { hashPassword } from "@/lib/password";
import { codeify, slugify } from "@/lib/text";

function encodeError(message: string) {
  return encodeURIComponent(message);
}

export async function registerAction(formData: FormData) {
  const companyName = String(formData.get("companyName") || "").trim();
  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const packagePlanId = String(formData.get("packagePlanId") || "").trim();

  if (!companyName || !fullName || !email || !password) {
    redirect(`/kayit?hata=${encodeError("Firma adı, ad soyad, e-posta ve şifre zorunludur.")}`);
  }

  if (password.length < 8) {
    redirect(`/kayit?hata=${encodeError("Şifre en az 8 karakter olmalıdır.")}`);
  }

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    redirect(`/kayit?hata=${encodeError("Bu e-posta ile kayıtlı bir kullanıcı zaten var.")}`);
  }

  const packagePlan = packagePlanId
    ? await db.packagePlan.findFirst({ where: { id: packagePlanId, isActive: true } })
    : await db.packagePlan.findFirst({ where: { isActive: true }, orderBy: [{ monthlyPrice: "asc" }, { name: "asc" }] });

  const baseSlug = slugify(companyName) || "firma";
  const baseCode = codeify(companyName) || "FIRMA";
  const tenantCount = await db.tenant.count();
  const slug = `${baseSlug}-${tenantCount + 1}`;
  const code = `${baseCode}_${tenantCount + 1}`;

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        fullName,
        phone: phone || null,
      },
    });

    const tenant = await tx.tenant.create({
      data: {
        name: companyName,
        slug,
        code,
        phone: phone || null,
        city: city || null,
        status: TenantStatus.TRIAL,
        planName: packagePlan?.name ?? "Başlangıç",
        packagePlanId: packagePlan?.id ?? null,
        createdByUserId: user.id,
        trialEndsAt,
        email,
      },
    });

    const branch = await tx.branch.create({
      data: {
        tenantId: tenant.id,
        name: "Merkez Şube",
        code: "MRK",
        city: city || null,
        isMain: true,
        phone: phone || null,
      },
    });

    await tx.membership.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        branchId: branch.id,
        role: MembershipRole.OWNER,
      },
    });

    return { user, tenant };
  });

  const token = await createSessionToken({
    userId: result.user.id,
    tenantId: result.tenant.id,
    membershipRole: MembershipRole.OWNER,
    globalRole: "USER",
  });

  await clearLockCookie();
  await setSessionCookie(token);
  await db.user.update({ where: { id: result.user.id }, data: { lastLoginAt: new Date() } });
  await sendVerificationEmail({
    userId: result.user.id,
    email: result.user.email,
    fullName: result.user.fullName,
  });

  redirect(`/kayit/dogrula?email=${encodeURIComponent(result.user.email)}`);
}

"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { clearLockCookie, createSessionToken, setSessionCookie, verifyPassword } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();

  if (!email || !password) {
    redirect("/giris?hata=E-posta%20ve%20%C5%9Fifre%20zorunludur.");
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
    redirect("/giris?hata=Kullan%C4%B1c%C4%B1%20bulunamad%C4%B1%20veya%20pasif%20durumda.");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    redirect("/giris?hata=%C5%9Eifre%20hatal%C4%B1.");
  }

  const membership = user.memberships[0] ?? null;
  const token = await createSessionToken({
    userId: user.id,
    tenantId: membership?.tenantId ?? null,
    membershipRole: membership?.role ?? null,
    globalRole: user.globalRole,
  });

  await clearLockCookie();
  await setSessionCookie(token);
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  redirect(user.globalRole === "FOUNDER" ? "/kurucu" : "/panel");
}

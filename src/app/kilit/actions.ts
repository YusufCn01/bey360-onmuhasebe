"use server";

import { redirect } from "next/navigation";
import { clearLockCookie, getCurrentUser, getSession, verifyPassword } from "@/lib/auth";

export async function unlockAction(formData: FormData) {
  const session = await getSession();
  if (!session) {
    redirect("/giris?hata=Oturum%20bulunamadi.");
  }

  const password = String(formData.get("password") || "").trim();
  const returnTo = String(formData.get("returnTo") || "").trim();

  if (!password) {
    redirect(`/kilit?hata=Sifre%20zorunludur.${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""}`);
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/giris?hata=Kullanici%20bulunamadi.");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    redirect(`/kilit?hata=Sifre%20hatali.${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""}`);
  }

  await clearLockCookie();

  if (returnTo && returnTo.startsWith("/")) {
    redirect(returnTo);
  }

  redirect(session.globalRole === "FOUNDER" ? "/kurucu" : "/panel");
}

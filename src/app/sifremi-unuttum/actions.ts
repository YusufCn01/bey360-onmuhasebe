"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/password-reset";

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email) {
    redirect("/sifremi-unuttum?hata=E-posta%20zorunludur.");
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    redirect(`/sifremi-unuttum?email=${encodeURIComponent(email)}&mesaj=Eger%20bu%20adres%20kayitliysa%20sifre%20yenileme%20baglantisi%20gonderildi.`);
  }

  await sendPasswordResetEmail({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
  });

  redirect(`/sifremi-unuttum?email=${encodeURIComponent(user.email)}&mesaj=Sifre%20yenileme%20baglantisi%20hazirlandi.`);
}

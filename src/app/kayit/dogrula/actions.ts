"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email-verification";

export async function resendVerificationAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) {
    redirect("/kayit/dogrula?hata=E-posta%20bulunamadi.");
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    redirect(`/kayit/dogrula?email=${encodeURIComponent(email)}&hata=Kullanici%20bulunamadi.`);
  }

  await sendVerificationEmail({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
  });
  redirect(`/kayit/dogrula?email=${encodeURIComponent(user.email)}&mesaj=Dogrulama%20baglantisi%20yenilendi.`);
}

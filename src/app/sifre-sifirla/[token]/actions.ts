"use server";

import { redirect } from "next/navigation";
import { consumePasswordResetToken } from "@/lib/password-reset";

export async function resetPasswordAction(token: string, formData: FormData) {
  const password = String(formData.get("password") || "").trim();
  const passwordConfirm = String(formData.get("passwordConfirm") || "").trim();

  if (!password || !passwordConfirm) {
    redirect(`/sifre-sifirla/${token}?hata=Sifre%20ve%20tekrar%20alani%20zorunludur.`);
  }

  if (password.length < 8) {
    redirect(`/sifre-sifirla/${token}?hata=Sifre%20en%20az%208%20karakter%20olmali.`);
  }

  if (password !== passwordConfirm) {
    redirect(`/sifre-sifirla/${token}?hata=Sifreler%20eslesmiyor.`);
  }

  const result = await consumePasswordResetToken(token, password);
  if (!result.success) {
    redirect(`/sifre-sifirla/${token}?hata=Baglanti%20gecersiz%20veya%20suresi%20dolmus.`);
  }

  redirect("/giris?hesap=owner&mesaj=Sifren%20yenilendi.%20Simdi%20giris%20yapabilirsin.");
}

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { uploadImage } from "@/lib/client-upload";

function buildInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function ProfileSettingsForm({
  initial,
}: {
  initial: {
    fullName: string;
    email: string;
    phone: string;
    avatarUrl: string;
  };
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initial.fullName);
  const [phone, setPhone] = useState(initial.phone);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const initials = useMemo(() => buildInitials(fullName || initial.fullName), [fullName, initial.fullName]);

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingAvatar(true);
    setProfileError(null);

    try {
      const uploadedUrl = await uploadImage(file, "profile-avatar");
      setAvatarUrl(uploadedUrl);
    } catch (uploadError) {
      setProfileError(uploadError instanceof Error ? uploadError.message : "Profil görseli yüklenemedi.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const response = await fetch("/api/panel/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, avatarUrl }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error?.message ?? "Profil güncellenemedi.");
      }

      setProfileSuccess("Profil bilgileri güncellendi.");
      router.refresh();
    } catch (submitError) {
      setProfileError(submitError instanceof Error ? submitError.message : "Profil güncellenemedi.");
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      const response = await fetch("/api/panel/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error?.message ?? "Şifre güncellenemedi.");
      }

      setPasswordSuccess("Şifren başarıyla güncellendi.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (submitError) {
      setPasswordError(submitError instanceof Error ? submitError.message : "Şifre güncellenemedi.");
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleProfileSubmit} className="space-y-5">
        <div className="flex flex-col gap-5 rounded-[22px] border border-slate-100 bg-slate-50/70 p-5 lg:flex-row lg:items-center">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Profil görseli" fill unoptimized className="object-cover" />
            ) : (
              <span className="text-2xl font-black text-slate-900">{initials}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-slate-900">Profil görseli</p>
            <p className="mt-1 text-sm text-slate-500">Header ve kullanıcı menüsünde görünen avatar alanını güncelleyebilirsin.</p>
          </div>

          <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300">
            {uploadingAvatar ? "Yükleniyor..." : "Görsel Seç"}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">Ad soyad</span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              placeholder="Ad soyad"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">Telefon</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              placeholder="05xx xxx xx xx"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">E-posta</span>
          <input
            value={initial.email}
            readOnly
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500 outline-none"
          />
        </label>

        {profileError ? <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{profileError}</p> : null}
        {profileSuccess ? <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{profileSuccess}</p> : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={profileLoading || uploadingAvatar}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-extrabold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {profileLoading ? "Kaydediliyor..." : "Profili Kaydet"}
          </button>
        </div>
      </form>

      <form onSubmit={handlePasswordSubmit} className="space-y-5 border-t border-slate-100 pt-6">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">Şifre değiştir</h3>
          <p className="mt-1 text-sm text-slate-500">Güvenli oturum için mevcut şifreni doğrulayıp yeni şifre tanımlayabilirsin.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">Mevcut şifre</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">Yeni şifre</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">Yeni şifre tekrar</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
          </label>
        </div>

        {passwordError ? <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{passwordError}</p> : null}
        {passwordSuccess ? <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{passwordSuccess}</p> : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={passwordLoading}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-slate-900 transition hover:border-slate-300 disabled:opacity-60"
          >
            {passwordLoading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
          </button>
        </div>
      </form>
    </div>
  );
}

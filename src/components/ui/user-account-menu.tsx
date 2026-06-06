"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function UserAccountMenu({
  userName,
  userTitle,
  userEmail,
  initials,
  avatarUrl,
}: {
  userName: string;
  userTitle: string;
  userEmail?: string | null;
  initials: string;
  avatarUrl?: string | null;
}) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<"lock" | "logout" | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLock() {
    setBusyAction("lock");
    try {
      const response = await fetch("/api/auth/lock", { method: "POST" });
      if (!response.ok) {
        throw new Error("Panel kilitlenemedi.");
      }

      router.replace("/kilit");
      router.refresh();
    } finally {
      setBusyAction(null);
      setIsOpen(false);
    }
  }

  async function handleLogout() {
    setBusyAction("logout");
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/giris");
      router.refresh();
    } finally {
      setBusyAction(null);
      setIsOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`flex items-center gap-3 rounded-full border px-3 py-2 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition ${
          isOpen ? "border-slate-300 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-300"
        }`}
        aria-label="Kullanıcı menüsü"
        aria-expanded={isOpen}
      >
        {avatarUrl ? (
          <span className="relative h-9 w-9 overflow-hidden rounded-full">
            <Image src={avatarUrl} alt={userName} fill unoptimized className="object-cover" />
          </span>
        ) : (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white">
            {initials}
          </span>
        )}
        <div className="min-w-0 text-left">
          <p className="truncate text-sm font-extrabold text-slate-900">{userName}</p>
          <p className="truncate text-xs text-slate-500">{userTitle}</p>
        </div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={`h-4 w-4 text-slate-400 transition ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[280px] rounded-[22px] border border-slate-200 bg-white p-3 shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
          <div className="rounded-[18px] border border-slate-100 bg-slate-50 px-3 py-3">
            <p className="text-sm font-extrabold text-slate-950">{userName}</p>
            <p className="mt-1 text-xs text-slate-500">{userEmail || userTitle}</p>
          </div>

          <div className="mt-3 space-y-1">
            <Link
              href="/panel/profil"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
                  <circle cx="12" cy="8" r="3.2" />
                  <path d="M6.5 19a5.5 5.5 0 0 1 11 0" />
                </svg>
              </span>
              <span className="flex-1">Profil Düzenle</span>
            </Link>

            <Link
              href="/panel/profil"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
                  <path d="M12 6v6" />
                  <path d="M9 9h6" />
                  <path d="M6 20v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1" />
                  <circle cx="12" cy="9" r="5" opacity="0" />
                </svg>
              </span>
              <span className="flex-1">Şifre ve Güvenlik</span>
            </Link>

            <Link
              href="/panel/ayarlar/firma"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
                  <path d="M4 19V7a2 2 0 0 1 2-2h8l6 6v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
                  <path d="M14 5v6h6" />
                </svg>
              </span>
              <span className="flex-1">Firma Ayarları</span>
            </Link>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={handleLock}
              disabled={busyAction !== null}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700 transition hover:border-slate-300 disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              {busyAction === "lock" ? "Bekleyin" : "Kilitle"}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={busyAction !== null}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-3 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <path d="M10 7H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4" />
                <path d="M14 17l5-5-5-5" />
                <path d="M9 12h10" />
              </svg>
              {busyAction === "logout" ? "Bekleyin" : "Çıkış"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

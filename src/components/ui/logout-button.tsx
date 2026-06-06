"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/giris");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2.5 text-[12px] font-bold text-white transition hover:bg-white/10 disabled:opacity-60"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <path d="M10 7H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4" />
            <path d="M14 17l5-5-5-5" />
            <path d="M9 12h10" />
          </svg>
        </span>
        <span>{loading ? "Çıkış yapılıyor..." : "Güvenli çıkış"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-[var(--line)] bg-white text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(15,23,42,0.1)] disabled:opacity-60"
      disabled={loading}
      aria-label="Güvenli çıkış"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M10 7H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4" />
        <path d="M14 17l5-5-5-5" />
        <path d="M9 12h10" />
      </svg>
    </button>
  );
}

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

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-white/10 ${
        compact ? "w-full text-white" : "w-full text-rose-200 hover:text-white"
      }`}
      disabled={loading}
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs">{compact ? "C" : "Ç"}</span>
      <span>{loading ? "Cikis yapiliyor..." : "Guvenli Cikis"}</span>
    </button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LockScreenButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleLock() {
    setBusy(true);

    try {
      const response = await fetch("/api/auth/lock", { method: "POST" });
      if (!response.ok) {
        throw new Error("Panel kilitlenemedi.");
      }

      router.replace("/kilit");
      router.refresh();
    } catch {
      setBusy(false);
      return;
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleLock}
        disabled={busy}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs">K</span>
        <span>{busy ? "Kilitleniyor..." : "Ekrani Kilitle"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLock}
      disabled={busy}
      className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-[var(--line)] bg-white text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(15,23,42,0.1)] disabled:opacity-60"
      aria-label="Ekrani kilitle"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    </button>
  );
}

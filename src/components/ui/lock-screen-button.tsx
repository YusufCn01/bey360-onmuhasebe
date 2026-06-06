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
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleLock}
        disabled={busy}
        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2.5 text-[12px] font-bold text-white transition hover:bg-white/10 disabled:opacity-60"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
        <span>{busy ? "Kilitleniyor..." : "Ekranı kilitle"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLock}
      disabled={busy}
      className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-[var(--line)] bg-white text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(15,23,42,0.1)] disabled:opacity-60"
      aria-label="Ekranı kilitle"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    </button>
  );
}

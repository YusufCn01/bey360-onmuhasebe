"use client";

import { ReminderStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReminderActionButtons({
  reminderId,
  isRead,
  status,
}: {
  reminderId: string;
  isRead: boolean;
  status: ReminderStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: "read" | "unread" | "done" | "reopen" | "cancel") {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/panel/reminders/${reminderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error ?? "Hatirlatma guncellenemedi.");
      }

      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Hatirlatma guncellenemedi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {!isRead ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => runAction("read")}
            className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-white disabled:opacity-50"
          >
            Okundu
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => runAction("unread")}
            className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-slate-600 disabled:opacity-50"
          >
            Tekrar goster
          </button>
        )}

        {status === "OPEN" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => runAction("done")}
            className="rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-white disabled:opacity-50"
          >
            Tamamla
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => runAction("reopen")}
            className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-slate-600 disabled:opacity-50"
          >
            Yeniden ac
          </button>
        )}

        {status !== "CANCELLED" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => runAction("cancel")}
            className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-rose-700 disabled:opacity-50"
          >
            Iptal
          </button>
        ) : null}
      </div>
      {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}

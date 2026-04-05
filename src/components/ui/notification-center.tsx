"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type NotificationReminderItem = {
  id: string;
  title: string;
  message: string | null;
  dueAt: string;
  status: "OPEN" | "DONE" | "CANCELLED";
  channel: "IN_APP" | "EMAIL" | "WHATSAPP";
  isRead: boolean;
  readAt: string | null;
  relatedType: string | null;
  relatedId: string | null;
  createdAt: string;
};

function formatAbsolute(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRelative(value: string) {
  const now = Date.now();
  const target = new Date(value).getTime();
  const diffMinutes = Math.round((target - now) / 60000);
  const absMinutes = Math.abs(diffMinutes);

  if (absMinutes < 1) {
    return "simdi";
  }

  if (absMinutes < 60) {
    return diffMinutes < 0 ? `${absMinutes} dk gecikti` : `${absMinutes} dk kaldi`;
  }

  const absHours = Math.round(absMinutes / 60);
  if (absHours < 24) {
    return diffMinutes < 0 ? `${absHours} sa gecikti` : `${absHours} sa kaldi`;
  }

  const absDays = Math.round(absHours / 24);
  return diffMinutes < 0 ? `${absDays} gun gecikti` : `${absDays} gun kaldi`;
}

function resolveReminderLink(item: NotificationReminderItem) {
  switch ((item.relatedType ?? "").toUpperCase()) {
    case "INVOICE":
    case "SALE_INVOICE":
      return "/panel/satislar";
    case "PURCHASE_INVOICE":
      return "/panel/alislar";
    case "CHEQUE":
    case "CHEQUE_NOTE":
      return "/panel/cek-senet";
    case "RETURN":
      return "/panel/iadeler";
    case "CUSTOMER":
      return "/panel/cari/musteriler";
    case "SUPPLIER":
      return "/panel/cari/tedarikciler";
    default:
      return "/panel/bildirimler";
  }
}

export function NotificationCenter({
  initialReminders,
  initialUnreadCount,
  initialOpenCount,
  initialOverdueCount,
}: {
  initialReminders: NotificationReminderItem[];
  initialUnreadCount: number;
  initialOpenCount: number;
  initialOverdueCount: number;
}) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAll, setBusyAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminders, setReminders] = useState(initialReminders);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [openCount, setOpenCount] = useState(initialOpenCount);
  const [overdueCount, setOverdueCount] = useState(initialOverdueCount);

  const syncFromServer = useCallback(async () => {
    const response = await fetch("/api/panel/reminders?limit=12", { cache: "no-store" });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.data) {
      throw new Error(result?.error ?? "Bildirimler yenilenemedi.");
    }

    setReminders(result.data.reminders);
    setUnreadCount(result.data.unreadCount);
    setOpenCount(result.data.openCount);
    setOverdueCount(result.data.overdueCount);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        syncFromServer().catch(() => null);
      }
    }, 30000);

    return () => window.clearInterval(interval);
  }, [syncFromServer]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const unreadLabel = useMemo(() => (unreadCount > 99 ? "99+" : String(unreadCount)), [unreadCount]);

  async function handleReminderAction(reminderId: string, action: "read" | "done" | "reopen" | "unread") {
    setBusyId(reminderId);
    setError(null);

    try {
      const response = await fetch(`/api/panel/reminders/${reminderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.data) {
        throw new Error(result?.error ?? "Bildirim guncellenemedi.");
      }

      setReminders((current) => current.map((item) => (item.id === reminderId ? result.data : item)));
      await syncFromServer();
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Bildirim guncellenemedi.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkAllRead() {
    setBusyAll(true);
    setError(null);

    try {
      const response = await fetch("/api/panel/reminders/mark-all-read", { method: "POST" });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error ?? "Tum bildirimler okundu yapilamadi.");
      }

      await syncFromServer();
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Tum bildirimler okundu yapilamadi.");
    } finally {
      setBusyAll(false);
    }
  }

  async function handleOpenPanel() {
    setIsOpen((current) => !current);
    if (!isOpen) {
      syncFromServer().catch(() => null);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={handleOpenPanel}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-[var(--line)] bg-white text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(15,23,42,0.1)]"
        aria-label="Bildirim merkezi"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
          <path d="M6 9a6 6 0 1 1 12 0v4l1.5 2.5H4.5L6 13z" />
          <path d="M10 18a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white shadow-[0_8px_20px_rgba(244,63,94,0.35)]">
            {unreadLabel}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="fixed inset-x-3 bottom-3 top-[5.5rem] z-40 flex flex-col rounded-[24px] border border-[var(--line)] bg-white p-4 shadow-[0_30px_70px_rgba(15,23,42,0.18)] sm:absolute sm:inset-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:block sm:w-[380px]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Bildirim Merkezi</p>
              <h3 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900">Hatirlatmalar</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={busyAll || unreadCount === 0}
                className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busyAll ? "Bekleyin..." : "Tumunu oku"}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] text-slate-500 sm:hidden"
                aria-label="Bildirim panelini kapat"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4.5 w-4.5">
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-[16px] bg-[var(--panel-soft)] px-3 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Okunmamis</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">{unreadCount}</p>
            </div>
            <div className="rounded-[16px] bg-[var(--panel-soft)] px-3 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Acik</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">{openCount}</p>
            </div>
            <div className="rounded-[16px] bg-[var(--panel-soft)] px-3 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Geciken</p>
              <p className="mt-1 text-xl font-extrabold text-rose-600">{overdueCount}</p>
            </div>
          </div>

          {error ? <p className="mt-3 text-xs font-semibold text-rose-600">{error}</p> : null}

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1 sm:max-h-[420px]">
            {reminders.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-[var(--line)] bg-[var(--panel-soft)] px-4 py-8 text-center text-sm text-slate-500">
                Simdilik bekleyen bir bildirim yok.
              </div>
            ) : (
              reminders.map((item) => {
                const isOverdue = item.status === "OPEN" && new Date(item.dueAt).getTime() < Date.now();
                return (
                  <div
                    key={item.id}
                    className={`rounded-[18px] border px-4 py-4 transition ${
                      item.isRead ? "border-[var(--line)] bg-white" : "border-rose-100 bg-rose-50/70 shadow-[0_14px_28px_rgba(244,63,94,0.08)]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 h-2.5 w-2.5 rounded-full ${item.isRead ? "bg-slate-300" : "bg-rose-500"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className={`text-sm ${item.isRead ? "font-bold text-slate-700" : "font-extrabold text-slate-900"}`}>{item.title}</p>
                            <p className={`mt-1 text-xs ${isOverdue ? "font-bold text-rose-600" : "text-slate-500"}`}>
                              {formatRelative(item.dueAt)} • {formatAbsolute(item.dueAt)}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                              item.status === "DONE"
                                ? "bg-emerald-100 text-emerald-700"
                                : item.status === "CANCELLED"
                                  ? "bg-slate-200 text-slate-600"
                                  : isOverdue
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-sky-100 text-sky-700"
                            }`}
                          >
                            {item.status === "DONE" ? "Tamamlandi" : item.status === "CANCELLED" ? "Iptal" : isOverdue ? "Acil" : "Aktif"}
                          </span>
                        </div>

                        {item.message ? <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.message}</p> : null}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {!item.isRead ? (
                            <button
                              type="button"
                              disabled={busyId === item.id}
                              onClick={() => handleReminderAction(item.id, "read")}
                              className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-white disabled:opacity-50"
                            >
                              Okundu
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={busyId === item.id}
                              onClick={() => handleReminderAction(item.id, "unread")}
                              className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-slate-600 disabled:opacity-50"
                            >
                              Tekrar goster
                            </button>
                          )}

                          {item.status === "OPEN" ? (
                            <button
                              type="button"
                              disabled={busyId === item.id}
                              onClick={() => handleReminderAction(item.id, "done")}
                              className="rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-white disabled:opacity-50"
                            >
                              Tamamla
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={busyId === item.id}
                              onClick={() => handleReminderAction(item.id, "reopen")}
                              className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-slate-600 disabled:opacity-50"
                            >
                              Yeniden ac
                            </button>
                          )}

                          <Link
                            href={resolveReminderLink(item)}
                            onClick={() => setIsOpen(false)}
                            className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-slate-600"
                          >
                            Ac
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
            <Link href="/panel/bildirimler" onClick={() => setIsOpen(false)} className="text-sm font-bold text-[var(--brand)]">
              Tum bildirimler
            </Link>
            <Link
              href="/panel/bildirimler/yeni"
              onClick={() => setIsOpen(false)}
              className="rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white"
            >
              Yeni hatirlatma
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

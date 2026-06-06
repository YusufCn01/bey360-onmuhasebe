"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type QuickAction = {
  id: string;
  href: string;
  label: string;
  description: string;
  icon: ReactNode;
};

const STORAGE_KEY = "bey360-mobile-quick-actions";

const ALL_ACTIONS: QuickAction[] = [
  {
    id: "sales-invoice",
    href: "/panel/satis-faturalari/yeni",
    label: "Sat?? faturas?",
    description: "Yeni sat?? faturas? olu?tur",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
        <path d="M6 4h9l3 3v13H6z" />
        <path d="M9 10h6" />
        <path d="M9 14h6" />
      </svg>
    ),
  },
  {
    id: "product",
    href: "/panel/stok/yeni",
    label: "?r?n ekle",
    description: "Stok kart? olu?tur",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),
  },
  {
    id: "customer",
    href: "/panel/cari/musteri/yeni",
    label: "M??teri ekle",
    description: "Cari m??teri kart? a?",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
        <circle cx="12" cy="8" r="3" />
        <path d="M6 19a6 6 0 0 1 12 0" />
      </svg>
    ),
  },
  {
    id: "supplier",
    href: "/panel/cari/tedarikci/yeni",
    label: "Tedarik?i ekle",
    description: "Yeni tedarik?i kart? a?",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
        <path d="M4 19V8l8-4 8 4v11" />
        <path d="M9 19v-4h6v4" />
      </svg>
    ),
  },
  {
    id: "payment",
    href: "/panel/finans/tahsilat-odeme/yeni",
    label: "Tahsilat / ?deme",
    description: "Para hareketi ba?lat",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
        <path d="M4 12h16" />
        <path d="M13 7l5 5-5 5" />
      </svg>
    ),
  },
  {
    id: "dispatch",
    href: "/panel/irsaliyeler/yeni",
    label: "?rsaliye",
    description: "Yeni sevk belgesi haz?rla",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
        <path d="M6 4h12v16H6z" />
        <path d="M9 9h6" />
        <path d="M9 13h6" />
      </svg>
    ),
  },
  {
    id: "quote",
    href: "/panel/teklif-siparis/teklif/yeni",
    label: "Teklif",
    description: "Teklif belgesi olu?tur",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
        <path d="M6 4h12v16H6z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </svg>
    ),
  },
  {
    id: "notifications",
    href: "/panel/bildirimler",
    label: "Bildirimler",
    description: "Hat?rlatma ve uyar?lar? a?",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
        <path d="M15 17H9" />
        <path d="M18 17H6l1.5-2.5V10a4.5 4.5 0 1 1 9 0v4.5z" />
      </svg>
    ),
  },
];

function itemActive(currentPath: string, href: string) {
  return currentPath === href || (href !== "/panel" && currentPath.startsWith(href));
}

function BarLink({ href, label, active, icon }: { href: string; label: string; active: boolean; icon: ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] font-bold uppercase tracking-[0.08em] ${
        active ? "text-slate-950" : "text-slate-500"
      }`}
    >
      <span className={`inline-flex h-9 w-9 items-center justify-center border ${active ? "border-slate-900 bg-slate-900 text-white" : "border-[var(--line)] bg-white text-slate-500"}`}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

function ActionRow({
  action,
  selected,
  editing,
  onSelect,
  onMoveLeft,
  onMoveRight,
  disableLeft,
  disableRight,
}: {
  action: QuickAction;
  selected: boolean;
  editing: boolean;
  onSelect: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  disableLeft?: boolean;
  disableRight?: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`flex w-full items-center gap-3 border px-3 py-3 text-left transition ${selected ? "border-slate-900 bg-slate-900 text-white" : "border-[var(--line)] bg-white text-slate-800"}`}
    >
      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center border ${selected ? "border-white/20 bg-white/10 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
        {action.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{action.label}</span>
        <span className={`block truncate text-[11px] ${selected ? "text-white/70" : "text-slate-500"}`}>{action.description}</span>
      </span>
      {editing ? (
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onMoveLeft?.();
            }}
            disabled={disableLeft}
            className="inline-flex h-8 w-8 items-center justify-center border border-current/15 disabled:opacity-30"
            aria-label={`${action.label} sola ta??`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onMoveRight?.();
            }}
            disabled={disableRight}
            className="inline-flex h-8 w-8 items-center justify-center border border-current/15 disabled:opacity-30"
            aria-label={`${action.label} sa?a ta??`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        </span>
      ) : null}
    </div>
  );
}

export function MobileBottomNav({ currentPath }: { currentPath: string }) {
  const router = useRouter();
  const [quickOpen, setQuickOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") {
      return ALL_ACTIONS.slice(0, 5).map((item) => item.id);
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return ALL_ACTIONS.slice(0, 5).map((item) => item.id);
      }

      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
    } catch {
      return ALL_ACTIONS.slice(0, 5).map((item) => item.id);
    }

    return ALL_ACTIONS.slice(0, 5).map((item) => item.id);
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
    } catch {
      // ignore storage errors
    }
  }, [selectedIds]);

  useEffect(() => {
    if (!quickOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [quickOpen]);

  useEffect(() => {
    function handleDrawerOpen() {
      setDrawerOpen(true);
      setEditing(false);
      setQuickOpen(false);
    }

    function handleDrawerClose() {
      setDrawerOpen(false);
    }

    window.addEventListener("bey360:mobile-drawer-open", handleDrawerOpen);
    window.addEventListener("bey360:mobile-drawer-close", handleDrawerClose);
    return () => {
      window.removeEventListener("bey360:mobile-drawer-open", handleDrawerOpen);
      window.removeEventListener("bey360:mobile-drawer-close", handleDrawerClose);
    };
  }, []);

  useEffect(() => {
    function handleCloseAll() {
      setEditing(false);
      setQuickOpen(false);
    }

    window.addEventListener("bey360:mobile-close-all-overlays", handleCloseAll);
    return () => window.removeEventListener("bey360:mobile-close-all-overlays", handleCloseAll);
  }, []);

  const visibleActions = useMemo(() => {
    const ordered = ALL_ACTIONS.filter((item) => selectedIds.includes(item.id)).sort(
      (left, right) => selectedIds.indexOf(left.id) - selectedIds.indexOf(right.id),
    );
    return ordered.slice(0, 5);
  }, [selectedIds]);

  function toggleAction(id: string) {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        if (current.length === 1) {
          return current;
        }
        return current.filter((item) => item !== id);
      }
      return [...current, id];
    });
  }

  function moveAction(id: string, direction: "left" | "right") {
    setSelectedIds((current) => {
      const index = current.indexOf(id);
      if (index === -1) return current;

      const targetIndex = direction === "left" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return current;

      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  function openQuickAction(href: string) {
    setEditing(false);
    setQuickOpen(false);
    router.push(href);
  }

  if (drawerOpen) {
    return null;
  }

  return (
    <>
      {quickOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="H?zl? i?lemleri kapat"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => {
              setEditing(false);
              setQuickOpen(false);
            }}
          />

          <div className="absolute inset-x-0 bottom-20 px-4">
            <div className="mx-auto w-full max-w-md border border-[var(--line)] bg-white shadow-[0_24px_48px_rgba(15,23,42,0.16)]">
              <div className="border-b border-[var(--line)] px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">H?zl? i?lemler</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {editing ? "K?sayollar? se? ve s?rala" : "S?k kullan?lan i?lemlere tek dokunu?la ge?"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing((value) => !value)}
                    className="border border-[var(--line)] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-600"
                  >
                    {editing ? "Bitti" : "D?zenle"}
                  </button>
                </div>
              </div>

              <div className="max-h-[60vh] space-y-2 overflow-y-auto px-4 py-4">
                {(editing ? ALL_ACTIONS : visibleActions).map((action) => {
                  const selected = selectedIds.includes(action.id);
                  const index = visibleActions.findIndex((item) => item.id === action.id);
                  return (
                    <ActionRow
                      key={action.id}
                      action={action}
                      selected={selected}
                      editing={editing}
                      disableLeft={index <= 0}
                      disableRight={index === -1 || index >= visibleActions.length - 1}
                      onMoveLeft={() => moveAction(action.id, "left")}
                      onMoveRight={() => moveAction(action.id, "right")}
                      onSelect={() => {
                        if (editing) {
                          toggleAction(action.id);
                          return;
                        }
                        openQuickAction(action.href);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-white px-3 pb-[max(.7rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
        <div className="mx-auto flex max-w-md items-center border border-[var(--line)] bg-white">
          <BarLink
            href="/panel/ayarlar"
            label="Ayarlar"
            active={itemActive(currentPath, "/panel/ayarlar")}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
                <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 1 0 12 8.5Z" />
                <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6Z" />
              </svg>
            }
          />
          <BarLink
            href="/panel"
            label="Panel"
            active={itemActive(currentPath, "/panel")}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
                <path d="M3 10.5L12 3l9 7.5" />
                <path d="M5.5 9.5V21h13V9.5" />
              </svg>
            }
          />
          <button
            type="button"
            onClick={() => {
              if (quickOpen) {
                setEditing(false);
                setQuickOpen(false);
                return;
              }
              window.dispatchEvent(new CustomEvent("bey360:mobile-close-all-overlays"));
              setQuickOpen(true);
            }}
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500"
            aria-label="H?zl? i?lemler"
          >
            <span className={`inline-flex h-9 w-9 items-center justify-center border ${quickOpen ? "border-slate-900 bg-slate-900 text-white" : "border-[var(--line)] bg-white text-slate-500"}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4.5 w-4.5">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </span>
            <span>H?zl?</span>
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("bey360:mobile-drawer-open"))}
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500"
            aria-label="Men?"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center border border-[var(--line)] bg-white text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </svg>
            </span>
            <span>Men?</span>
          </button>
        </div>
      </nav>
    </>
  );
}

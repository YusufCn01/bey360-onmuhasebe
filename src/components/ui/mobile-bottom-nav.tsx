"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type QuickAction = {
  id: string;
  href: string;
  label: string;
  tone: string;
  icon: React.ReactNode;
};

const STORAGE_KEY = "bey360-mobile-quick-actions";

const ALL_ACTIONS: QuickAction[] = [
  {
    id: "sales-invoice",
    href: "/panel/satis-faturalari/yeni",
    label: "Satış Faturası",
    tone: "bg-[var(--brand)]",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M6 4h9l3 3v13H6z" />
        <path d="M9 10h6" />
        <path d="M9 14h6" />
      </svg>
    ),
  },
  {
    id: "retail-invoice",
    href: "/panel/satis-faturalari/perakende-yeni",
    label: "Perakende",
    tone: "bg-rose-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M7 8h10" />
        <path d="M7 12h10" />
        <path d="M7 16h6" />
        <path d="M5 4h14v16H5z" />
      </svg>
    ),
  },
  {
    id: "product",
    href: "/panel/stok/yeni",
    label: "Ürün Ekle",
    tone: "bg-sky-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),
  },
  {
    id: "payment",
    href: "/panel/finans/tahsilat-odeme/yeni",
    label: "Tahsilat",
    tone: "bg-emerald-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M4 12h16" />
        <path d="M13 7l5 5-5 5" />
      </svg>
    ),
  },
  {
    id: "dispatch",
    href: "/panel/irsaliyeler/yeni",
    label: "İrsaliye",
    tone: "bg-amber-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M6 4h12v16H6z" />
        <path d="M9 9h6" />
        <path d="M9 13h6" />
      </svg>
    ),
  },
  {
    id: "notifications",
    href: "/panel/bildirimler",
    label: "Bildirimler",
    tone: "bg-violet-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M15 17H9" />
        <path d="M18 17H6l1.5-2.5V10a4.5 4.5 0 1 1 9 0v4.5z" />
      </svg>
    ),
  },
  {
    id: "customer",
    href: "/panel/cari/musteri/yeni",
    label: "Müşteri",
    tone: "bg-slate-700",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <circle cx="12" cy="8" r="3" />
        <path d="M6 19a6 6 0 0 1 12 0" />
      </svg>
    ),
  },
  {
    id: "supplier",
    href: "/panel/cari/tedarikci/yeni",
    label: "Tedarikçi",
    tone: "bg-cyan-600",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M4 19V8l8-4 8 4v11" />
        <path d="M9 19v-4h6v4" />
      </svg>
    ),
  },
  {
    id: "quote",
    href: "/panel/teklif-siparis/teklif/yeni",
    label: "Teklif",
    tone: "bg-fuchsia-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M6 4h12v16H6z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </svg>
    ),
  },
];

function itemActive(currentPath: string, href: string) {
  return currentPath === href || (href !== "/panel" && currentPath.startsWith(href));
}

function NavItem({ href, label, active, icon }: { href: string; label: string; active: boolean; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[16px] px-2 py-2 text-[11px] font-bold transition ${
        active ? "bg-rose-50 text-[var(--brand)]" : "text-slate-500"
      }`}
    >
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-[14px] ${active ? "bg-[var(--brand)] text-white" : "bg-slate-100 text-slate-500"}`}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

function QuickActionBubble({ action, onSelect, selected, editable }: { action: QuickAction; onSelect: () => void; selected?: boolean; editable?: boolean }) {
  return (
    <button type="button" onClick={onSelect} className="flex w-[84px] flex-col items-center gap-2 text-center">
      <span
        className={`relative inline-flex h-14 w-14 items-center justify-center rounded-full border ${
          selected ? "border-slate-900/10" : "border-white/70"
        } ${action.tone} text-white shadow-[0_16px_30px_rgba(15,23,42,0.18)]`}
      >
        {action.icon}
        {editable ? (
          <span className={`absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black ${selected ? "bg-white text-slate-900" : "bg-slate-900 text-white"}`}>
            {selected ? "✓" : "+"}
          </span>
        ) : null}
      </span>
      <span className="text-[11px] font-bold leading-4 text-slate-700">{action.label}</span>
    </button>
  );
}

export function MobileBottomNav({ currentPath }: { currentPath: string }) {
  const [quickOpen, setQuickOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") {
      return ALL_ACTIONS.slice(0, 6).map((item) => item.id);
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return ALL_ACTIONS.slice(0, 6).map((item) => item.id);
      }

      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
    } catch {
      // ignore local preference errors
    }

    return ALL_ACTIONS.slice(0, 6).map((item) => item.id);
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
    } catch {
      // ignore local preference errors
    }
  }, [selectedIds]);

  useEffect(() => {
    if (!quickOpen) {
      return;
    }
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

  const visibleActions = useMemo(() => {
    const ordered = ALL_ACTIONS.filter((item) => selectedIds.includes(item.id)).sort(
      (left, right) => selectedIds.indexOf(left.id) - selectedIds.indexOf(right.id),
    );
    return ordered.slice(0, 6);
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
      if (index === -1) {
        return current;
      }

      const targetIndex = direction === "left" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  const actionsToRender = editing ? ALL_ACTIONS : visibleActions;

  return (
    <>
      {quickOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Hızlı işlemleri kapat"
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
            onClick={() => {
              setEditing(false);
              setQuickOpen(false);
            }}
          />
          <div className="absolute inset-x-0 bottom-28 flex justify-center px-4">
            <div className="w-full max-w-sm rounded-[30px] border border-[var(--line)] bg-white p-5 shadow-[0_28px_70px_rgba(15,23,42,0.2)]">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Hızlı İşlemler</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {editing ? "Görünecek kısayolları seç" : "Tek dokunuşla en sık kullandığımız ekranlar"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing((value) => !value)}
                  className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-slate-600"
                >
                  {editing ? "Bitti" : "Düzenle"}
                </button>
              </div>
              {editing ? (
                <div className="mb-4 rounded-[18px] border border-[var(--line)] bg-[var(--panel-soft)] p-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Görünen Sıra</p>
                  <div className="mt-3 space-y-2">
                    {visibleActions.map((action, index) => (
                      <div key={action.id} className="flex items-center gap-2 rounded-[14px] bg-white px-3 py-2">
                        <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${action.tone} text-white`}>
                          {action.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-800">{action.label}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveAction(action.id, "left")}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-slate-500 disabled:opacity-35"
                            aria-label={`${action.label} sola taşı`}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                              <path d="m15 6-6 6 6 6" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            disabled={index === visibleActions.length - 1}
                            onClick={() => moveAction(action.id, "right")}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-slate-500 disabled:opacity-35"
                            aria-label={`${action.label} sağa taşı`}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                              <path d="m9 6 6 6-6 6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="grid grid-cols-3 gap-x-3 gap-y-4 justify-items-center">
                {actionsToRender.map((action) => (
                  <QuickActionBubble
                    key={action.id}
                    action={action}
                    editable={editing}
                    selected={selectedIds.includes(action.id)}
                    onSelect={() => {
                      if (editing) {
                        toggleAction(action.id);
                        return;
                      }

                      setEditing(false);
                      setQuickOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <nav
        className={`fixed inset-x-3 bottom-3 z-30 rounded-[24px] border border-[var(--line)] bg-white/96 p-2 shadow-[0_20px_50px_rgba(15,23,42,0.18)] backdrop-blur lg:hidden ${
          drawerOpen ? "pointer-events-none opacity-0 translate-y-6" : "opacity-100 translate-y-0"
        } transition-all duration-200`}
      >
        <div className="flex items-center gap-1.5">
          <NavItem
            href="/panel"
            label="Ana Sayfa"
            active={itemActive(currentPath, "/panel")}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
                <path d="M3 10.5L12 3l9 7.5" />
                <path d="M5.5 9.5V21h13V9.5" />
                <path d="M9.5 21v-6h5v6" />
              </svg>
            }
          />
          <NavItem
            href="/panel/satislar"
            label="Satış"
            active={itemActive(currentPath, "/panel/satislar") || itemActive(currentPath, "/panel/satis-faturalari")}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
                <path d="M4 19h16" />
                <path d="M6 16l4-5 3 3 5-7" />
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

              setQuickOpen(true);
            }}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[16px] px-2 py-2 text-[11px] font-bold transition ${
              quickOpen ? "bg-rose-50 text-[var(--brand)]" : "text-slate-500"
            }`}
            aria-label="Hızlı işlemler"
          >
            <span className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${quickOpen ? "bg-[var(--brand)] text-white rotate-45" : "bg-[var(--brand)] text-white"} shadow-[0_12px_24px_rgba(213,32,42,0.25)] transition-transform`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </span>
            <span className="truncate">Hızlı</span>
          </button>
          <NavItem
            href="/panel/stok"
            label="Stok"
            active={itemActive(currentPath, "/panel/stok")}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
                <path d="M4 8l8-4 8 4-8 4-8-4z" />
                <path d="M4 12l8 4 8-4" />
              </svg>
            }
          />
          <NavItem
            href="/panel/para"
            label="Finans"
            active={itemActive(currentPath, "/panel/para") || itemActive(currentPath, "/panel/finans")}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
                <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5z" />
                <path d="M16 12h3" />
              </svg>
            }
          />
        </div>
      </nav>
    </>
  );
}

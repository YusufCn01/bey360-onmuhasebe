"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LockScreenButton } from "@/components/ui/lock-screen-button";
import { LogoutButton } from "@/components/ui/logout-button";
import type { ShellNavGroup, ShellNavItem } from "@/components/ui/app-shell";

function isItemActive(currentPath: string, item: ShellNavItem) {
  if (item.href) {
    return currentPath === item.href || (item.href !== "/panel" && currentPath.startsWith(item.href));
  }

  return item.children?.some((child) => currentPath === child.href || currentPath.startsWith(child.href)) ?? false;
}

function renderNavIcon(icon?: string) {
  const common = "h-4.5 w-4.5";

  switch (icon) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5.5 9.5V21h13V9.5" />
          <path d="M9.5 21v-6h5v6" />
        </svg>
      );
    case "sales":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M4 19h16" />
          <path d="M6 16l4-5 3 3 5-7" />
          <path d="M18 7h2v2" />
        </svg>
      );
    case "purchase":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M4 5h16" />
          <path d="M7 9l5 5 5-5" />
          <path d="M12 14V4" />
          <path d="M4 19h16" />
        </svg>
      );
    case "expense":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M6 4h12" />
          <path d="M7 8h10" />
          <path d="M9 12h6" />
          <path d="M4 20h16" />
        </svg>
      );
    case "contact":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M16.5 20v-1.5A3.5 3.5 0 0 0 13 15h-2a3.5 3.5 0 0 0-3.5 3.5V20" />
          <circle cx="12" cy="8" r="3" />
          <path d="M19 9h2" />
          <path d="M20 8v2" />
        </svg>
      );
    case "stock":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M4 8l8-4 8 4-8 4-8-4z" />
          <path d="M4 12l8 4 8-4" />
          <path d="M4 16l8 4 8-4" />
        </svg>
      );
    case "wallet":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5z" />
          <path d="M16 12h3" />
          <circle cx="15.5" cy="12" r=".5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "edonusum":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M7 7h10v10H7z" />
          <path d="M12 4v3" />
          <path d="M12 17v3" />
          <path d="M4 12h3" />
          <path d="M17 12h3" />
        </svg>
      );
    case "report":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M5 19V9" />
          <path d="M12 19V5" />
          <path d="M19 19v-7" />
          <path d="M3 19h18" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 1 0 12 8.5Z" />
          <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6Z" />
        </svg>
      );
    case "integrations":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M8 7h4" />
          <path d="M12 17h4" />
          <path d="M10 12h4" />
          <circle cx="6" cy="7" r="2" />
          <circle cx="18" cy="17" r="2" />
          <circle cx="8" cy="12" r="2" />
          <path d="M8 8.5l1 2" />
          <path d="M12 12h2" />
        </svg>
      );
    case "pos":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M8 9h8" />
          <path d="M8 13h3" />
          <path d="M14 13h2" />
        </svg>
      );
    default:
      return <span className="text-[11px] font-extrabold tracking-[0.14em]">{(icon ?? "..").slice(0, 2).toUpperCase()}</span>;
  }
}

export function MobileNavDrawer({
  navGroups,
  currentPath,
  userName,
  userTitle,
  environmentLabel,
  creditLabel,
  senderAlias,
  updatedAtLabel,
}: {
  navGroups: ShellNavGroup[];
  currentPath: string;
  userName: string;
  userTitle: string;
  environmentLabel: string;
  creditLabel: string;
  senderAlias?: string | null;
  updatedAtLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  function closeDrawer() {
    window.dispatchEvent(new CustomEvent("bey360:mobile-drawer-close"));
    setOpen(false);
  }

  const filteredNavGroups = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    if (!normalized) {
      return navGroups;
    }

    return navGroups
      .map((group) => {
        const items = group.items
          .map((item) => {
            const itemMatches = item.label.toLocaleLowerCase("tr-TR").includes(normalized);
            const children = item.children?.filter((child) => child.label.toLocaleLowerCase("tr-TR").includes(normalized)) ?? [];

            if (itemMatches) {
              return item;
            }

            if (children.length > 0) {
              return {
                ...item,
                children,
              };
            }

            return null;
          })
          .filter(Boolean) as ShellNavItem[];

        return {
          ...group,
          items,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [navGroups, query]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(new CustomEvent("bey360:mobile-drawer-open"));
          setQuery("");
          setOpen(true);
        }}
        className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] border border-[var(--line)] bg-white text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.06)] lg:hidden"
        aria-label="Menüyü aç"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Menüyü kapat" onClick={closeDrawer} className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" />

          <div className="absolute inset-y-0 left-0 h-dvh w-[min(94vw,380px)] bg-[var(--sidebar)] text-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
            <div className="flex h-full min-h-0 flex-col">
              <div className="border-b border-[var(--sidebar-border)] bg-gradient-to-b from-[var(--brand)] to-[#a6101c] px-5 py-5">
                <div className="flex items-center justify-between gap-3">
                  <Link href="/panel" className="flex items-center gap-3" onClick={closeDrawer}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-[var(--brand)]">B</div>
                    <div>
                      <p className="font-display text-[1.7rem] font-extrabold leading-none tracking-tight">Bey360</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/80">Mobil Menü</p>
                    </div>
                  </Link>

                  <button type="button" onClick={closeDrawer} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/12 text-white">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                      <path d="M6 6l12 12" />
                      <path d="M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="border-b border-[var(--sidebar-border)] px-5 py-4">
                <p className="text-sm font-extrabold text-white">{userName}</p>
                <p className="mt-1 text-xs text-slate-300">{userTitle}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-bold text-cyan-100">
                    {environmentLabel}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-bold text-emerald-100">
                    Kontör {creditLabel}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                  <span>Son güncelleme: {updatedAtLabel}</span>
                  {senderAlias ? <span className="truncate">GB hazır</span> : null}
                </div>
                <div className="mt-3">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Menüde ara"
                    className="w-full rounded-[14px] border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-8">
                {filteredNavGroups.length === 0 ? (
                  <div className="rounded-[18px] border border-white/10 bg-white/6 px-4 py-8 text-center text-sm text-slate-300">
                    Aramana uygun menü bulunamadı.
                  </div>
                ) : filteredNavGroups.map((group) => (
                  <div key={group.title || "menu"} className="mb-5 last:mb-0">
                    {group.title ? <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--sidebar-muted)]">{group.title}</p> : null}

                    <div className="space-y-2.5">
                      {group.items.map((item) => {
                        const active = isItemActive(currentPath, item);
                        const iconContent = renderNavIcon(item.icon);

                        if (item.children?.length) {
                          return (
                            <details key={item.label} open={active} className={`rounded-[18px] border ${active ? "border-white/12 bg-white/10" : "border-white/6 bg-white/[0.03]"}`}>
                              <summary className="flex cursor-pointer list-none items-center gap-3 px-3.5 py-3 text-[14px] font-semibold text-white marker:content-none">
                                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-[12px] ${active ? "bg-white text-[var(--brand)]" : "bg-white/8 text-white/85"}`}>
                                  {iconContent}
                                </span>
                                <span className="leading-5">{item.label}</span>
                                <span className="ml-auto text-xs text-white/45">{item.badge ?? ">"}</span>
                              </summary>

                              <div className="space-y-1.5 px-3 pb-3 pl-[3.6rem]">
                                {item.children.map((child) => {
                                  const childActive = currentPath === child.href || currentPath.startsWith(child.href);

                                  return (
                                    <Link
                                      key={child.href}
                                      href={child.href}
                                      onClick={closeDrawer}
                                      className={`flex items-center rounded-[10px] px-3 py-2.5 text-[13px] font-medium ${
                                        childActive ? "bg-white text-[var(--brand)]" : "text-slate-200 hover:bg-white/8 hover:text-white"
                                      }`}
                                    >
                                      {child.label}
                                    </Link>
                                  );
                                })}
                              </div>
                            </details>
                          );
                        }

                        return (
                          <Link
                            key={item.href}
                            href={item.href ?? "#"}
                            onClick={closeDrawer}
                            className={`flex items-center gap-3 rounded-[18px] border px-3.5 py-3 text-[14px] font-semibold ${
                              active ? "border-white/12 bg-white/12 text-white" : "border-white/6 bg-white/[0.03] text-slate-200"
                            }`}
                          >
                            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-[12px] ${active ? "bg-white text-[var(--brand)]" : "bg-white/8 text-white/85"}`}>
                              {iconContent}
                            </span>
                            <span className="leading-5">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="shrink-0 space-y-2 border-t border-[var(--sidebar-border)] bg-[var(--sidebar)] px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <LockScreenButton compact />
                <LogoutButton compact />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

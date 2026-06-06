"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
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
        </svg>
      );
    case "purchase":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M4 5h16" />
          <path d="M7 9l5 5 5-5" />
          <path d="M12 14V4" />
        </svg>
      );
    case "contact":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M16.5 20v-1.5A3.5 3.5 0 0 0 13 15h-2a3.5 3.5 0 0 0-3.5 3.5V20" />
          <circle cx="12" cy="8" r="3" />
        </svg>
      );
    case "stock":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M4 8l8-4 8 4-8 4-8-4z" />
          <path d="M4 12l8 4 8-4" />
        </svg>
      );
    case "wallet":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5z" />
          <path d="M16 12h3" />
        </svg>
      );
    case "edonusum":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M7 7h10v10H7z" />
          <path d="M12 4v3" />
          <path d="M12 17v3" />
        </svg>
      );
    case "report":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M5 19V9" />
          <path d="M12 19V5" />
          <path d="M19 19v-7" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 1 0 12 8.5Z" />
          <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6Z" />
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
    case "integrations":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M8 7h4" />
          <path d="M12 17h4" />
          <path d="M10 12h4" />
          <circle cx="6" cy="7" r="2" />
          <circle cx="18" cy="17" r="2" />
          <circle cx="8" cy="12" r="2" />
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
}: {
  navGroups: ShellNavGroup[];
  currentPath: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredNavGroups = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    if (!normalized) return navGroups;

    return navGroups
      .map((group) => {
        const items = group.items
          .map((item) => {
            const itemMatches = item.label.toLocaleLowerCase("tr-TR").includes(normalized);
            const children = item.children?.filter((child) => child.label.toLocaleLowerCase("tr-TR").includes(normalized)) ?? [];

            if (itemMatches) return item;
            if (children.length > 0) return { ...item, children };
            return null;
          })
          .filter(Boolean) as ShellNavItem[];

        return { ...group, items };
      })
      .filter((group) => group.items.length > 0);
  }, [navGroups, query]);

  function closeDrawer() {
    window.dispatchEvent(new CustomEvent("bey360:mobile-drawer-close"));
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    function handleCloseAll() {
      setOpen(false);
    }

    window.addEventListener("bey360:mobile-close-all-overlays", handleCloseAll);
    return () => window.removeEventListener("bey360:mobile-close-all-overlays", handleCloseAll);
  }, []);

  const content = open ? (
    <div className="fixed inset-0 z-[120] lg:hidden">
      <button type="button" aria-label="Menüyü kapat" onClick={closeDrawer} className="absolute inset-0 bg-slate-950/42" />

      <div className="absolute inset-y-0 left-0 w-full max-w-[380px] overflow-hidden bg-[#f7f9fb] text-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <div className="flex h-full min-h-0 flex-col">
          <div className="border-b border-[#d7dee6] px-4 pb-4 pt-[max(0.9rem,env(safe-area-inset-top))]">
            <div className="flex items-start justify-between gap-3">
              <Link href="/panel" onClick={closeDrawer} className="min-w-0 flex-1 overflow-hidden border border-[#d7dee6] bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-[#e4eaf0] bg-white">
                    <Image
                      src="/brand/bey360-logo-transparent.png"
                      alt="Bey360"
                      width={48}
                      height={48}
                      className="h-12 w-12 object-contain"
                      priority
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-extrabold text-slate-950">Bey360</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">Ön Muhasebe</p>
                    <p className="mt-2 text-xs text-slate-500">Finans, e-dönüşüm ve operasyon menüsü</p>
                  </div>
                </div>
              </Link>

              <button
                type="button"
                onClick={closeDrawer}
                className="inline-flex h-11 w-11 items-center justify-center border border-[#d7dee6] bg-white text-slate-700"
                aria-label="Menüyü kapat"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="mt-3">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Modül ara"
                className="w-full border border-[#d7dee6] bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {filteredNavGroups.length === 0 ? (
              <div className="border border-[#d7dee6] bg-white px-4 py-10 text-center text-sm text-slate-500">
                Aramana uygun menü bulunamadı.
              </div>
            ) : (
              <div className="space-y-5">
                {filteredNavGroups.map((group) => (
                  <section key={group.title || "menu"} className="space-y-2">
                    {group.title ? (
                      <div className="px-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{group.title}</p>
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      {group.items.map((item) => {
                        const active = isItemActive(currentPath, item);
                        const iconContent = renderNavIcon(item.icon);

                        if (item.children?.length) {
                          return (
                            <details key={item.label} open={active} className="border border-[#d7dee6] bg-white">
                              <summary className="flex cursor-pointer list-none items-center gap-3 px-3.5 py-3 text-[14px] font-semibold marker:content-none">
                                <span className={`inline-flex h-10 w-10 items-center justify-center border ${active ? "border-[#d8e1ea] bg-[#f5f8fb] text-[var(--brand)]" : "border-[#e2e8ef] bg-white text-slate-500"}`}>
                                  {iconContent}
                                </span>
                                <span className="leading-5 text-slate-900">{item.label}</span>
                                <span className="ml-auto text-xs text-slate-400">{">"}</span>
                              </summary>

                              <div className="space-y-1.5 px-3 pb-3 pl-[3.8rem]">
                                {item.children.map((child) => {
                                  const childActive = currentPath === child.href || currentPath.startsWith(child.href);
                                  return (
                                    <Link
                                      key={child.href}
                                      href={child.href}
                                      onClick={closeDrawer}
                                      className={`flex items-center border px-3 py-2.5 text-[13px] font-medium ${childActive ? "border-[#2c4a63] bg-[#f5f8fb] text-slate-950" : "border-[#e2e8ef] text-slate-700 hover:bg-[#f8fafc] hover:text-slate-950"}`}
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
                            className={`flex items-center gap-3 border px-3.5 py-3 text-[14px] font-semibold ${active ? "border-[#2c4a63] bg-[#f5f8fb] text-slate-950" : "border-[#d7dee6] bg-white text-slate-900 hover:bg-[#f8fafc]"}`}
                          >
                            <span className={`inline-flex h-10 w-10 items-center justify-center border ${active ? "border-[#d8e1ea] bg-[#f5f8fb] text-[var(--brand)]" : "border-[#e2e8ef] bg-white text-slate-500"}`}>
                              {iconContent}
                            </span>
                            <span className="flex-1">{item.label}</span>
                            {item.badge ? (
                              <span className={`border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] ${active ? "border-[#d8e1ea] bg-white text-slate-700" : "border-[#d7dee6] bg-[#f8fafc] text-slate-500"}`}>
                                {item.badge}
                              </span>
                            ) : null}
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-[#d7dee6] px-4 py-4">
            <LockScreenButton compact />
            <LogoutButton compact />
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        aria-label="Menüyü aç"
        onClick={() => {
          window.dispatchEvent(new CustomEvent("bey360:mobile-close-all-overlays"));
          setOpen(true);
        }}
        className="inline-flex h-11 w-11 items-center justify-center border border-slate-200 bg-white text-slate-700"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      </button>
      {typeof document !== "undefined" ? createPortal(content, document.body) : null}
    </>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ShellNavGroup } from "@/components/ui/app-shell";

type CommandItem = {
  href: string;
  label: string;
  group: string;
};

function flattenGroups(navGroups: ShellNavGroup[]): CommandItem[] {
  return navGroups.flatMap((group) =>
    group.items.flatMap((item) => {
      if (item.href) {
        return [{ href: item.href, label: item.label, group: group.title || "Menü" }];
      }

      return (item.children ?? []).map((child) => ({
        href: child.href,
        label: child.label,
        group: item.label,
      }));
    }),
  );
}

export function MobileCommandPalette({ navGroups }: { navGroups: ShellNavGroup[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const allItems = useMemo(() => flattenGroups(navGroups), [navGroups]);
  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    if (!normalized) {
      return allItems.slice(0, 12);
    }

    return allItems.filter((item) => {
      return item.label.toLocaleLowerCase("tr-TR").includes(normalized) || item.group.toLocaleLowerCase("tr-TR").includes(normalized);
    });
  }, [allItems, query]);

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

  useEffect(() => {
    function handleCloseAll() {
      setQuery("");
      setOpen(false);
    }

    window.addEventListener("bey360:mobile-close-all-overlays", handleCloseAll);
    return () => window.removeEventListener("bey360:mobile-close-all-overlays", handleCloseAll);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(new CustomEvent("bey360:mobile-close-all-overlays"));
          setQuery("");
          setOpen(true);
        }}
        className="inline-flex h-11 w-11 touch-manipulation items-center justify-center rounded-[16px] border border-[var(--line)] bg-white text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
        aria-label="Hızlı arama"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
          <circle cx="11" cy="11" r="6" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Komut panelini kapat"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
          />
          <div className="absolute inset-x-3 top-20 rounded-[24px] border border-[var(--line)] bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Komut Paneli</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">Ekran veya işlem ara</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setOpen(false);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] text-slate-500"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4.5 w-4.5">
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </svg>
              </button>
            </div>

            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Satış faturası, stok, müşteri, bildirim..."
              className="w-full rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />

            <div className="mt-4 max-h-[58vh] space-y-2 overflow-y-auto pr-1">
              {filteredItems.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-[var(--line)] bg-[var(--panel-soft)] px-4 py-8 text-center text-sm text-slate-500">
                  Aramana uygun komut bulunamadı.
                </div>
              ) : (
                filteredItems.map((item) => (
                  <Link
                    key={`${item.group}-${item.href}`}
                    href={item.href}
                    onClick={() => {
                      setQuery("");
                      setOpen(false);
                    }}
                    className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--line)] bg-white px-4 py-3 hover:bg-[var(--panel-soft)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{item.label}</p>
                      <p className="truncate text-[11px] uppercase tracking-[0.14em] text-slate-400">{item.group}</p>
                    </div>
                    <span className="text-xs font-bold text-[var(--brand)]">Aç</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

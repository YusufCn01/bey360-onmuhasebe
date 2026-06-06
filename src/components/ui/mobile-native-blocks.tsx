import Link from "next/link";
import type { ReactNode } from "react";

export function MobileHeroPanel({
  eyebrow,
  title,
  text,
  children,
}: {
  eyebrow: string;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <section className="erp-card rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbfb_100%)] p-4 text-slate-900 shadow-[0_18px_48px_rgba(15,23,42,0.06)] lg:hidden">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{eyebrow}</p>
      <h2 className="mt-2 text-[1.5rem] font-extrabold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}

export function MobileStatStrip({
  items,
}: {
  items: Array<{ label: string; value: string; tone?: "light" | "success" | "warn" | "danger" }>;
}) {
  const toneMap = {
    light: "border-slate-200 bg-white text-slate-900",
    success: "border-emerald-200 bg-emerald-50 text-slate-900",
    warn: "border-amber-200 bg-amber-50 text-slate-900",
    danger: "border-rose-200 bg-rose-50 text-slate-900",
  } as const;

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <div key={item.label} className={`rounded-[18px] border px-3 py-3 ${toneMap[item.tone ?? "light"]}`}>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
          <p className="mt-1 text-sm font-extrabold">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export function MobileFilterBar({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="erp-glass sticky top-[4.05rem] z-10 -mx-1 rounded-[22px] border border-slate-200 p-3 shadow-[0_16px_34px_rgba(15,23,42,0.05)] lg:hidden">
      {children}
    </div>
  );
}

export function MobileActionChips({
  actions,
}: {
  actions: Array<{ href: string; label: string }>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Link
          key={action.href + action.label}
          href={action.href}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-slate-700"
        >
          <span>{action.label}</span>
          <span className="text-slate-400">{">"}</span>
        </Link>
      ))}
    </div>
  );
}

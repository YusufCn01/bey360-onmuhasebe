import Link from "next/link";
import type { ReactNode } from "react";

export function SummaryCard({ title, value, detail, accent = "border-slate-300" }: { title: string; value: string; detail: string; accent?: string }) {
  return (
    <article className={`erp-card p-5 sm:p-6 transition hover:shadow-md ${accent ?? ""}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">{title}</p>
      <h3 className="mt-3 text-[1.65rem] font-extrabold tracking-tight text-[var(--text)] sm:text-[1.85rem]">{value}</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">{detail}</p>
    </article>
  );
}

export function SectionCard({ eyebrow, title, action, children }: { eyebrow: string; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <article className="erp-card">
      <div className="flex flex-col gap-4 border-b border-[var(--line)] px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">{eyebrow}</p>
          <h2 className="font-display mt-1 text-[1.2rem] font-extrabold tracking-tight text-[var(--brand-navy)] sm:text-[1.35rem]">{title}</h2>
        </div>
        {action ? <div className="w-full lg:w-auto">{action}</div> : null}
      </div>
      <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
    </article>
  );
}

export function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-4 py-3 text-sm transition hover:bg-white hover:shadow-sm">
      <span className="text-[var(--muted)] font-medium">{label}</span>
      <span className="font-extrabold text-[var(--text)]">{value}</span>
    </div>
  );
}

export function StatusPill({ label, tone = "slate" }: { label: string; tone?: "slate" | "emerald" | "amber" | "blue" | "rose" }) {
  const toneMap = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
  } as const;

  return <span className={`border rounded-md px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] shadow-sm ${toneMap[tone]}`}>{label}</span>;
}

export function QuickActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-[var(--brand)] bg-[var(--brand)] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--brand-strong)] sm:w-auto">
      {label}
    </Link>
  );
}

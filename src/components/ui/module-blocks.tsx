import Link from "next/link";
import type { ReactNode } from "react";

export function SummaryCard({ title, value, detail, accent = "border-slate-300" }: { title: string; value: string; detail: string; accent?: string }) {
  return (
    <article className={`rounded-[14px] border ${accent} bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-5`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{title}</p>
      <h3 className="mt-3 text-[1.7rem] font-extrabold tracking-tight text-slate-900 sm:text-[2rem]">{value}</h3>
      <p className="mt-2 text-sm font-semibold text-slate-500">{detail}</p>
    </article>
  );
}

export function SectionCard({ eyebrow, title, action, children }: { eyebrow: string; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <article className="rounded-[14px] border border-[var(--line)] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-4 border-b border-[var(--line)] px-4 py-4 sm:px-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p>
          <h2 className="font-display mt-1 text-[1.35rem] font-extrabold tracking-tight text-slate-900 sm:text-[1.55rem]">{title}</h2>
        </div>
        {action ? <div className="w-full lg:w-auto">{action}</div> : null}
      </div>
      <div className="px-4 py-4 sm:px-5 sm:py-5">{children}</div>
    </article>
  );
}

export function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-extrabold text-slate-900">{value}</span>
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

  return <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${toneMap[tone]}`}>{label}</span>;
}

export function QuickActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex h-10 w-full items-center justify-center rounded-[10px] bg-[var(--brand)] px-4 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(213,32,42,0.18)] hover:bg-[var(--brand-strong)] sm:w-auto">
      {label}
    </Link>
  );
}

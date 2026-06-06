"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SmartFinanceInsightContent } from "@/components/dashboard/smart-finance-insight-content";

type InsightCard = {
  title: string;
  score: number;
  summary: string;
};

type Recommendation = {
  title: string;
  detail: string;
  href: string;
};

export function SmartFinanceInsightModal(props: {
  tenantName: string;
  last30Sales: number;
  last30Purchases: number;
  receivableBalance: number;
  payableBalance: number;
  prev30Sales: number;
  openReminders: number;
  insightCards: InsightCard[];
  recommendations: Recommendation[];
  mobile?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const button = props.mobile ? (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-slate-700"
    >
      Akıllı Analiz
      <span className="text-slate-400">&gt;</span>
    </button>
  ) : (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="inline-flex h-10 items-center justify-center rounded-[12px] bg-[var(--brand)] px-4 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(17,138,120,0.18)] hover:bg-[var(--brand-strong)]"
    >
      Yapay Zeka Finansal İçgörü
    </button>
  );

  return (
    <>
      {button}
      {typeof document !== "undefined" && open
        ? createPortal(
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(15,23,42,0.42)] px-4 py-8 backdrop-blur-[3px]">
              <button type="button" aria-label="Kapat" className="absolute inset-0" onClick={() => setOpen(false)} />
              <div className="relative z-[121] w-full max-w-[820px] overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.28)]">
                <div className="flex items-start justify-between gap-4 px-7 py-7 sm:px-8 sm:py-8">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#eef2ff_0%,#fdf2f8_100%)] text-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                      <span aria-hidden="true">✨</span>
                    </div>
                    <div>
                      <h3 className="text-[1.05rem] font-extrabold tracking-tight text-slate-900 sm:text-[1.15rem]">Yapay Zeka Finansal İçgörü</h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-xl font-light text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                  >
                    ×
                  </button>
                </div>

                <div className="mx-7 border-t border-slate-200 sm:mx-8" />

                <div className="max-h-[70vh] overflow-y-auto px-7 py-5 sm:px-8 sm:py-6">
                  <SmartFinanceInsightContent {...props} compact />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

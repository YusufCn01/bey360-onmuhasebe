"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PackageChangeRequestReview({
  requestId,
  currentPlanName,
  targetPlanName,
  tenantName,
  requestNote,
}: {
  requestId: string;
  currentPlanName: string;
  targetPlanName: string;
  tenantName: string;
  requestNote?: string | null;
}) {
  const router = useRouter();
  const [reviewNote, setReviewNote] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(action: "approve" | "reject") {
    setBusy(action);
    setError(null);

    try {
      const response = await fetch(`/api/kurucu/package-change-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewNote }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error?.message ?? result?.error ?? "İşlem tamamlanamadı.");
      }

      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "İşlem tamamlanamadı.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-extrabold text-slate-900">{tenantName}</p>
          <p className="mt-1 text-sm text-slate-500">
            {currentPlanName} → {targetPlanName}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => handleAction("approve")}
            className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white disabled:opacity-60"
          >
            {busy === "approve" ? "Onaylanıyor..." : "Onayla"}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => handleAction("reject")}
            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-rose-700 disabled:opacity-60"
          >
            {busy === "reject" ? "Reddediliyor..." : "Reddet"}
          </button>
        </div>
      </div>

      {requestNote ? (
        <div className="mt-3 rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Müşteri notu</p>
          <p className="mt-1">{requestNote}</p>
        </div>
      ) : null}

      <label className="mt-3 block">
        <span className="mb-2 block text-sm font-semibold text-slate-600">Kurucu notu</span>
        <textarea
          rows={3}
          value={reviewNote}
          onChange={(event) => setReviewNote(event.target.value)}
          placeholder="Talep sahibine görünecek kısa bir not ekleyebilirsin."
          className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[var(--brand)] focus:outline-none"
        />
      </label>

      {error ? <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}

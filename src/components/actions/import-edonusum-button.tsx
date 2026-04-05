"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ImportAnalysis = {
  supplier: {
    exists: boolean;
    name: string;
    taxNumber?: string | null;
    email?: string | null;
  };
  missingProducts: Array<{
    code?: string | null;
    barcode?: string | null;
    name: string;
    unit: string;
    unitPrice: number;
    vatRate: number;
  }>;
  itemCount: number;
  canImportDirectly: boolean;
};

async function postImport(body: Record<string, unknown>) {
  const response = await fetch("/api/panel/e-donusum/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => null);
  return { response, result };
}

function toneClass(active: boolean) {
  return active ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700";
}

export function ImportEDonusumButton({ appType, uuid, documentId }: { appType: number; uuid: string; documentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [createMissingSupplier, setCreateMissingSupplier] = useState(false);
  const [createMissingProducts, setCreateMissingProducts] = useState(false);

  const canContinue = useMemo(() => {
    if (!analysis) return false;
    if (!analysis.supplier.exists && !createMissingSupplier) return false;
    if (analysis.missingProducts.length > 0 && !createMissingProducts) return false;
    return true;
  }, [analysis, createMissingProducts, createMissingSupplier]);

  async function openAnalysisModal() {
    setBusy(true);
    setMessage(null);
    setError(null);

    try {
      const analysisRequest = await postImport({ appType, uuid, documentId, dryRun: true });
      if (!analysisRequest.response.ok) {
        setError(analysisRequest.result?.error ?? "Belge analizi alınamadı.");
        return;
      }

      const nextAnalysis = (analysisRequest.result?.data ?? null) as ImportAnalysis | null;
      setAnalysis(nextAnalysis);
      setCreateMissingSupplier(false);
      setCreateMissingProducts(false);
      setModalOpen(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Belge analizi sırasında beklenmeyen bir hata oluştu.");
    } finally {
      setBusy(false);
    }
  }

  async function handleImport() {
    if (!analysis) return;

    setBusy(true);
    setError(null);

    try {
      const importRequest = await postImport({
        appType,
        uuid,
        documentId,
        createMissingSupplier,
        createMissingProducts,
      });

      if (!importRequest.response.ok) {
        setError(importRequest.result?.error ?? "Belge içe alınamadı.");
        return;
      }

      const createdSupplier = importRequest.result?.data?.createdSupplier ? " Yeni tedarikçi oluşturuldu." : "";
      const createdProducts =
        typeof importRequest.result?.data?.createdProducts === "number" && importRequest.result.data.createdProducts > 0
          ? ` ${importRequest.result.data.createdProducts} yeni ürün oluşturuldu.`
          : "";

      setMessage(`Alış faturası oluşturuldu: ${importRequest.result?.data?.invoiceNo ?? "-"}.${createdSupplier}${createdProducts}`);
      setModalOpen(false);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "İçe alma sırasında beklenmeyen bir hata oluştu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={openAnalysisModal}
        disabled={busy}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {busy ? "Hazırlanıyor..." : "İçe Al"}
      </button>

      {message ? <p className="max-w-[220px] text-[11px] font-semibold text-emerald-600">{message}</p> : null}
      {error && !modalOpen ? <p className="max-w-[220px] text-[11px] font-semibold text-rose-600">{error}</p> : null}

      {modalOpen && analysis ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[22px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">e-Dönüşüm İçe Al</p>
                <h3 className="mt-1 text-xl font-extrabold text-slate-900">{documentId || uuid}</h3>
                <p className="mt-1 text-sm text-slate-500">Belge analiz edildi. Eksik kayıtlar için nasıl ilerleyeceğimizi birlikte seçelim.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setError(null);
                }}
                className="rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Kapat
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <section className="rounded-[16px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Tedarikçi</p>
                    <h4 className="mt-1 text-base font-extrabold text-slate-900">{analysis.supplier.name}</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      {analysis.supplier.taxNumber || "Vergi no yok"}
                      {analysis.supplier.email ? ` · ${analysis.supplier.email}` : ""}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${toneClass(analysis.supplier.exists)}`}>
                    {analysis.supplier.exists ? "Kayıtlı" : "Eksik"}
                  </span>
                </div>

                {!analysis.supplier.exists ? (
                  <label className="mt-4 flex items-start gap-3 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-slate-700">
                    <input type="checkbox" className="mt-0.5" checked={createMissingSupplier} onChange={(event) => setCreateMissingSupplier(event.target.checked)} />
                    <span>Bu tedarikçi için yeni kart oluşturulsun.</span>
                  </label>
                ) : null}
              </section>

              <section className="rounded-[16px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Ürünler</p>
                    <h4 className="mt-1 text-base font-extrabold text-slate-900">{analysis.itemCount} satır analiz edildi</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      {analysis.missingProducts.length > 0
                        ? `${analysis.missingProducts.length} ürün sistemde bulunamadı.`
                        : "Tüm ürünler sistemde eşleşti."}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${toneClass(analysis.missingProducts.length === 0)}`}>
                    {analysis.missingProducts.length === 0 ? "Hazır" : "Eksik"}
                  </span>
                </div>

                {analysis.missingProducts.length > 0 ? (
                  <>
                    <label className="mt-4 flex items-start gap-3 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-slate-700">
                      <input type="checkbox" className="mt-0.5" checked={createMissingProducts} onChange={(event) => setCreateMissingProducts(event.target.checked)} />
                      <span>Eksik ürünler otomatik oluşturulsun.</span>
                    </label>

                    <div className="mt-4 overflow-hidden rounded-[14px] border border-slate-200 bg-white">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-left text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Ürün</th>
                            <th className="px-4 py-3">Kod / Barkod</th>
                            <th className="px-4 py-3">Birim</th>
                            <th className="px-4 py-3">Fiyat</th>
                            <th className="px-4 py-3">KDV</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {analysis.missingProducts.map((item, index) => (
                            <tr key={`${item.code ?? "kodsuz"}-${item.barcode ?? "barkodsuz"}-${index}`}>
                              <td className="px-4 py-3 font-semibold text-slate-900">{item.name}</td>
                              <td className="px-4 py-3 text-slate-600">
                                {item.code || "-"}
                                <span className="text-slate-400"> / </span>
                                {item.barcode || "-"}
                              </td>
                              <td className="px-4 py-3 text-slate-600">{item.unit}</td>
                              <td className="px-4 py-3 text-slate-600">{item.unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="px-4 py-3 text-slate-600">%{item.vatRate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : null}
              </section>

              {error ? <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
              <p className="text-sm text-slate-500">Onay verdiğimiz kayıtlar oluşturulduktan sonra belge alış faturası taslağı olarak içeri alınacak.</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setError(null);
                  }}
                  className="rounded-[10px] border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={busy || !canContinue}
                  className="rounded-[10px] bg-[var(--brand)] px-4 py-2 text-sm font-extrabold text-white disabled:opacity-50"
                >
                  {busy ? "İçe Alınıyor..." : "Devam Et ve İçe Al"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";

export function ProductPriceBulkActions() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function downloadFile(url: string, filename: string) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Dosya indirilemedi.");
    }

    const blob = await response.blob();
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
  }

  async function handleTemplate() {
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      await downloadFile("/api/panel/products/prices/template", "toplu-fiyat-sablonu.xlsx");
      setMessage("Toplu fiyat güncelleme şablonu indirildi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Şablon indirilemedi.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCurrentList() {
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      await downloadFile("/api/panel/products/prices/export", "urun-fiyat-listesi.xlsx");
      setMessage("Mevcut ürün fiyat listesi indirildi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fiyat listesi indirilemedi.");
    } finally {
      setBusy(false);
    }
  }

  async function handleImport(file: File) {
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/panel/products/prices/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error ?? "Toplu fiyat güncelleme başarısız.");
      }

      const summary = result?.data;
      setMessage(`${summary?.updated ?? 0} ürün fiyatı güncellendi, ${summary?.skipped ?? 0} satır atlandı.`);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Toplu fiyat güncelleme başarısız.");
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCurrentList}
          disabled={busy}
          className="rounded-[10px] border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Mevcut Fiyatları İndir
        </button>
        <button
          type="button"
          onClick={handleTemplate}
          disabled={busy}
          className="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
        >
          Boş Şablonu İndir
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-[10px] bg-[var(--brand)] px-4 py-2.5 text-sm font-extrabold text-white hover:bg-[var(--brand-strong)] disabled:opacity-60"
        >
          Fiyat Excel&apos;i Yükle
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleImport(file);
          }
        }}
      />

      <p className="text-xs text-slate-500">
        Güncelleme eşleştirmesi önce ürün koduna, sonra barkoda göre yapılır. Dosyada yalnızca fiyat alanlarını değiştirmeniz yeterlidir.
      </p>

      <div className="space-y-1">
        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
        {message ? <p className="text-sm font-semibold text-emerald-600">{message}</p> : null}
      </div>
    </div>
  );
}

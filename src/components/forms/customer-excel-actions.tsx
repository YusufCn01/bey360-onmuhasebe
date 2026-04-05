"use client";

import { useRef, useState } from "react";

type CustomerExcelFormat = "logo" | "hizli-bilisim";

const formatOptions: Array<{ value: CustomerExcelFormat; label: string }> = [
  { value: "logo", label: "Logo" },
  { value: "hizli-bilisim", label: "Hızlı Bilişim" },
];

export function CustomerExcelActions() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [format, setFormat] = useState<CustomerExcelFormat>("logo");
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
      await downloadFile(`/api/panel/customers/template?format=${format}`, format === "logo" ? "logo-musteri-sablonu.xlsx" : "hizli-bilisim-cariler.xlsx");
      setMessage(`${format === "logo" ? "Logo" : "Hızlı Bilişim"} örnek şablonu indirildi.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Şablon indirilemedi.");
    } finally {
      setBusy(false);
    }
  }

  async function handleExport() {
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      await downloadFile(`/api/panel/customers/export?format=${format}`, format === "logo" ? "musteriler-logo.xlsx" : "musteriler-hizli-bilisim.xlsx");
      setMessage(`${format === "logo" ? "Logo" : "Hızlı Bilişim"} formatında Excel dışa aktarıldı.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Excel'e aktarma başarısız.");
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
      formData.append("format", format);

      const response = await fetch("/api/panel/customers/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error ?? "Excel içe aktarımı başarısız.");
      }

      const summary = result?.data;
      setMessage(
        `${summary?.imported ?? 0} yeni kayıt eklendi, ${summary?.updated ?? 0} kayıt güncellendi, ${summary?.skipped ?? 0} satır atlandı.`,
      );
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Excel içe aktarımı başarısız.");
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 lg:grid-cols-[260px_1fr] lg:items-end">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-600">Excel formatı</span>
          <select value={format} onChange={(event) => setFormat(event.target.value as CustomerExcelFormat)} disabled={busy}>
            {formatOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleTemplate}
            disabled={busy}
            className="rounded-[10px] border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Seçili Şablonu İndir
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-[10px] bg-[var(--brand)] px-4 py-2.5 text-sm font-extrabold text-white hover:bg-[var(--brand-strong)] disabled:opacity-60"
          >
            Excel&apos;den Veri Aktar
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={busy}
            className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
          >
            Excel&apos;e Aktar
          </button>
        </div>
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
        Seçili formata göre başlıklar değişir. Hızlı Bilişim içe aktarmada müşteri kodu boşsa sistem otomatik kod üretir.
      </p>

      <div className="space-y-1">
        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
        {message ? <p className="text-sm font-semibold text-emerald-600">{message}</p> : null}
      </div>
    </div>
  );
}

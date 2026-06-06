"use client";

import { useState } from "react";

type GibUser = {
  Identifier?: string;
  Alias?: string;
  Title?: string;
  Type?: string;
};

type LookupResult = {
  type: "PK" | "GB";
  appType?: 1;
  users: GibUser[];
  note?: string | null;
};

export function HizliBilisimMukellefLookup() {
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<LookupResult[]>([]);
  const [manualAlias, setManualAlias] = useState("");
  const [manualMessage, setManualMessage] = useState<string | null>(null);
  const [turmobKey, setTurmobKey] = useState("");
  const [turmobNote, setTurmobNote] = useState<string | null>(null);
  const [turmobError, setTurmobError] = useState<string | null>(null);
  const [turmobData, setTurmobData] = useState<Record<string, unknown> | null>(null);

  async function fetchLookup(type: "PK" | "GB", appType: 1, signal: AbortSignal) {
    const response = await fetch("/api/panel/settings/hizli-bilisim/gib-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, type, appType }),
      signal,
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(result?.error ?? "GİB kullanıcı sorgulama başarısız oldu.");
    }

    return {
      type,
      appType,
      users: (result?.data?.users ?? []) as GibUser[],
      note: result?.data?.note ?? null,
    };
  }

  async function handleLookup() {
    setBusy(true);
    setError(null);
    setNote(null);
    setResults([]);
    setManualMessage(null);
    setTurmobNote(null);
    setTurmobError(null);
    setTurmobData(null);

    try {
      if (!identifier.trim()) {
        throw new Error("VKN / TCKN girilmelidir.");
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const [pk, gb] = await Promise.all([fetchLookup("PK", 1, controller.signal), fetchLookup("GB", 1, controller.signal)]);
      setResults([pk, gb]);
      clearTimeout(timeout);
      setNote("Sorgu tamamlandı (e-Fatura alias kontrolü).");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setError("Sorgu zaman aşımına uğradı. Lütfen tekrar deneyin.");
      } else {
        setError(error instanceof Error ? error.message : "Sorgu sırasında beklenmeyen bir hata oluştu.");
      }
    } finally {
      setBusy(false);
    }
  }

  const hasAlias = results.some((result) => result.users.some((user) => user.Alias));
  const statusLabel = hasAlias ? "e-Fatura Mükellefi" : "e-Arşiv (Alias bulunamadı)";
  const statusTone = hasAlias ? "text-emerald-600" : "text-amber-600";

  async function handleManualMark() {
    setManualMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/panel/customers/mark-einvoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taxNumber: identifier, alias: manualAlias, registered: true }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error ?? "Manuel güncelleme başarısız oldu.");
      }
      setManualMessage(`Manuel olarak e-Fatura işaretlendi. Güncellenen kayıt: ${result?.data?.count ?? 0}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Manuel güncelleme sırasında hata oluştu.");
    }
  }

  async function handleTurmobLookup() {
    setTurmobNote(null);
    setTurmobError(null);
    setTurmobData(null);
    try {
      if (!identifier.trim()) {
        throw new Error("VKN/TCKN zorunludur.");
      }

      const response = await fetch("/api/panel/settings/hizli-bilisim/mukellef", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vknTckn: identifier, meslekMensubuKey: turmobKey || undefined }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error ?? "Mükellef sorgulama başarısız oldu.");
      }
      setTurmobNote(result?.data?.note ?? "Sorgu tamamlandı.");
      setTurmobData((result?.data?.mukellef ?? null) as Record<string, unknown> | null);
    } catch (error) {
      setTurmobError(error instanceof Error ? error.message : "TÜRMOB sorgulaması sırasında hata oluştu.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-600">VKN / TCKN</span>
          <input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="Örn: 1234567890"
          />
        </label>

        <button
          type="button"
          onClick={handleLookup}
          disabled={busy || !identifier.trim()}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-100 disabled:opacity-60"
        >
          {busy ? "Sorgulanıyor..." : "Mükellef Durumunu Sorgula"}
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Sistem PK ve GB aliaslarını birlikte sorgular. Herhangi bir alias bulunduğunda müşteri e-Fatura mükellefi olarak kabul edilir.
      </p>

      {note ? <p className="text-sm font-semibold text-slate-700">{note}</p> : null}
      {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

      {results.length ? (
        <div className="rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
          <p className="text-sm font-black text-slate-900">Sonuç</p>
          <p className={`mt-1 text-base font-extrabold ${statusTone}`}>{statusLabel}</p>
        </div>
      ) : null}

      {results.length && !hasAlias ? (
        <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="text-sm font-black text-amber-800">Mükellef görünüyor ama sonuç e-Arşiv mi?</p>
          <p className="mt-1 text-xs text-amber-700">
            Canlı sistemde kayıtlı olmasına rağmen alias dönmüyorsa müşteriyi manuel olarak e-Fatura işaretleyebilirsiniz.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <label className="space-y-2">
              <span className="text-xs font-semibold text-amber-800">Alias (opsiyonel)</span>
              <input
                value={manualAlias}
                onChange={(event) => setManualAlias(event.target.value)}
                placeholder="urn:mail:... (varsa)"
                className="border-amber-200 bg-white"
              />
            </label>
            <button
              type="button"
              onClick={handleManualMark}
              className="rounded-2xl border border-amber-300 bg-white px-4 py-3 text-xs font-black text-amber-800 hover:bg-amber-100"
            >
              Manuel e-Fatura İşaretle
            </button>
          </div>
          {manualMessage ? <p className="mt-2 text-xs font-semibold text-emerald-700">{manualMessage}</p> : null}
        </div>
      ) : null}

      {results.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {results.map((result) => (
            <div key={`${result.type}-${result.appType ?? 1}`} className="overflow-hidden rounded-[14px] border border-[var(--line)] bg-white">
              <div className="border-b border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                {result.type} Alias Sonuçları · AppType {result.appType ?? 1}
              </div>
              {result.users.length ? (
                <table className="w-full text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Identifier</th>
                      <th className="px-4 py-3">Alias</th>
                      <th className="px-4 py-3">Ünvan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {result.users.map((user, index) => (
                      <tr key={`${result.type}-${user.Identifier ?? "row"}-${index}`}>
                        <td className="px-4 py-3 font-mono text-slate-700">{user.Identifier ?? "-"}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{user.Alias ?? "-"}</td>
                        <td className="px-4 py-3 text-slate-700">{user.Title ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-4 py-6 text-sm text-slate-500">Bu tip için alias bulunamadı.</div>
              )}
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
        <p className="text-sm font-black text-slate-900">TÜRMOB Mükellef Bilgisi</p>
        <p className="mt-1 text-xs text-slate-500">
          Türmob sorgusu için meslek mensubu key gereklidir. Key, e-Birlik panelinden alınır ve Hızlı Bilişim üzerinden sorgulanır.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1.2fr_auto] md:items-end">
          <label className="space-y-2">
            <span className="text-xs font-semibold text-slate-600">VKN / TCKN</span>
            <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="1234567890" />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold text-slate-600">Meslek Mensubu Key</span>
            <input value={turmobKey} onChange={(event) => setTurmobKey(event.target.value)} placeholder="Ayarlar’da kayıtlıysa boş bırakılabilir" />
          </label>
          <button
            type="button"
            onClick={handleTurmobLookup}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 hover:bg-slate-100"
          >
            Türmob Sorgula
          </button>
        </div>
        {turmobNote ? <p className="mt-2 text-xs font-semibold text-emerald-700">{turmobNote}</p> : null}
        {turmobError ? <p className="mt-2 text-xs font-semibold text-rose-600">{turmobError}</p> : null}
        {turmobData ? (
          <div className="mt-3 grid gap-2 rounded-[12px] border border-[var(--line)] bg-white p-3 text-xs text-slate-600">
            {Object.entries(turmobData).slice(0, 8).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="font-semibold text-slate-500">{key}</span>
                <span className="text-slate-800">{String(value ?? "-")}</span>
              </div>
            ))}
            <p className="text-[11px] text-slate-400">Detaylar başarıyla geldiyse TÜRMOB mükellef kaydı bulunuyor.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

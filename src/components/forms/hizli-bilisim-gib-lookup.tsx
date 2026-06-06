"use client";

import { useState } from "react";

type GibUser = {
  Identifier?: string;
  Alias?: string;
  Title?: string;
  Type?: string;
};

export function HizliBilisimGibLookup() {
  const [identifier, setIdentifier] = useState("");
  const [type, setType] = useState<"PK" | "GB">("PK");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<GibUser[]>([]);

  async function handleLookup() {
    setBusy(true);
    setError(null);
    setNote(null);
    setUsers([]);
    try {
      if (!identifier.trim()) {
        throw new Error("VKN / TCKN girilmelidir.");
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const response = await fetch("/api/panel/settings/hizli-bilisim/gib-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, type, appType: 1 }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(result?.error ?? "GİB kullanıcı sorgulama başarısız oldu.");
        setBusy(false);
        return;
      }

      setUsers(result?.data?.users ?? []);
      setNote(result?.data?.note ?? "Sorgu tamamlandı.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setError("Sorgu zaman aşımına uğradı. Lütfen tekrar deneyin.");
      } else {
        setError(error instanceof Error ? error.message : "GİB kullanıcı sorgulama sırasında beklenmeyen bir hata oluştu.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-end">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-600">VKN / TCKN / Etiket</span>
          <input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="Örn: 1234567890"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-600">Sorgu tipi</span>
          <select value={type} onChange={(event) => setType(event.target.value as "PK" | "GB")}>
            <option value="PK">PK Alias</option>
            <option value="GB">GB Alias</option>
          </select>
        </label>

        <button
          type="button"
          onClick={handleLookup}
          disabled={busy || !identifier.trim()}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-100 disabled:opacity-60"
        >
          {busy ? "Sorgulanıyor..." : "GİB Kullanıcısını Sorgula"}
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Bu alan gönderim öncesi alıcı alias doğrulaması içindir. e-Fatura senaryosunda sonuçta dönen `Alias` değeri Hızlı Bilişim gönderiminde kullanılır.
      </p>

      {note ? <p className="text-sm font-semibold text-emerald-600">{note}</p> : null}
      {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

      {users.length ? (
        <div className="overflow-x-auto rounded-[14px] border border-[var(--line)]">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-[var(--panel-soft)] text-[11px] uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Identifier</th>
                <th className="px-4 py-3">Alias</th>
                <th className="px-4 py-3">Ünvan</th>
                <th className="px-4 py-3">Tip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] bg-white">
              {users.map((user, index) => (
                <tr key={`${user.Identifier ?? "row"}-${index}`}>
                  <td className="px-4 py-3 font-mono text-slate-700">{user.Identifier ?? "-"}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{user.Alias ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{user.Title ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-500">{user.Type ?? type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

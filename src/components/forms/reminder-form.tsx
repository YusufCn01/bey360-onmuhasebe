"use client";

import Link from "next/link";
import { ReminderChannel } from "@prisma/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReminderForm({ redirectPath }: { redirectPath: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [channel, setChannel] = useState<ReminderChannel>(ReminderChannel.IN_APP);
  const [relatedType, setRelatedType] = useState("");
  const [relatedId, setRelatedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/panel/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          dueAt,
          channel,
          relatedType,
          relatedId,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error ?? "Hatırlatma kaydedilemedi.");
      }

      setTitle("");
      setMessage("");
      setDueAt("");
      setRelatedType("");
      setRelatedId("");
      setSuccess("Hatırlatma oluşturuldu.");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Hatırlatma kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Bildirim ve Hatırlatma</p>
          <h3 className="mt-1 text-[1.7rem] font-extrabold tracking-tight text-slate-900">Yeni hatırlatma</h3>
          <p className="mt-1 text-sm text-slate-500">Çek/senet, iade, fatura ve genel operasyonlar için görev hatırlatmaları oluşturun.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={busy} className="rounded-[10px] bg-[var(--brand)] px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-60">
            {busy ? "Kaydediliyor..." : "Kaydet"}
          </button>
          <Link href={redirectPath} className="rounded-[10px] border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
            Listeye Dön
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.7fr]">
        <section className="rounded-[16px] border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-600">Başlık</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-600">Tarih / Saat</span>
              <input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-600">Kanal</span>
              <select value={channel} onChange={(event) => setChannel(event.target.value as ReminderChannel)}>
                <option value="IN_APP">Uygulama içi</option>
                <option value="EMAIL">E-posta</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-600">İlgili kayıt tipi</span>
              <input value={relatedType} onChange={(event) => setRelatedType(event.target.value)} placeholder="Örn: CHEQUE, INVOICE, RETURN" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-600">İlgili kayıt ID</span>
              <input value={relatedId} onChange={(event) => setRelatedId(event.target.value)} placeholder="İsteğe bağlı" />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-600">Mesaj</span>
              <textarea rows={4} value={message} onChange={(event) => setMessage(event.target.value)} />
            </label>
          </div>
        </section>

        <aside className="rounded-[16px] border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Özet</p>
          <p className="mt-2 text-lg font-extrabold text-slate-900">{title || "Hatırlatma başlığı"}</p>
          <p className="mt-1 text-sm text-slate-500">{dueAt || "Henüz tarih seçilmedi"}</p>
          {success ? <p className="mt-4 text-sm font-semibold text-emerald-600">{success}</p> : null}
          {error ? <p className="mt-4 text-sm font-semibold text-rose-600">{error}</p> : null}
        </aside>
      </div>
    </form>
  );
}

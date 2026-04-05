"use client";

import Link from "next/link";
import { ChequeNoteDirection, ChequeNoteType } from "@prisma/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type PartyOption = {
  id: string;
  code: string;
  name: string;
};

export function ChequeNoteForm({
  customers,
  suppliers,
  redirectPath,
}: {
  customers: PartyOption[];
  suppliers: PartyOption[];
  redirectPath: string;
}) {
  const router = useRouter();
  const [type, setType] = useState<ChequeNoteType>(ChequeNoteType.CHEQUE);
  const [direction, setDirection] = useState<ChequeNoteDirection>(ChequeNoteDirection.RECEIVED);
  const [referenceNo, setReferenceNo] = useState("");
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/panel/cheque-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          direction,
          referenceNo,
          customerId: direction === ChequeNoteDirection.RECEIVED ? customerId : null,
          supplierId: direction === ChequeNoteDirection.ISSUED ? supplierId : null,
          amount,
          issueDate,
          dueDate,
          bankName,
          branchName,
          accountNo,
          ownerName,
          note,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error ?? "Çek / senet kaydedilemedi.");
      }

      setMessage("Çek / senet kaydı oluşturuldu.");
      setReferenceNo("");
      setAmount("");
      setDueDate("");
      setBankName("");
      setBranchName("");
      setAccountNo("");
      setOwnerName("");
      setNote("");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Çek / senet kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Finans Aracı</p>
          <h3 className="mt-1 text-[1.7rem] font-extrabold tracking-tight text-slate-900">Yeni çek / senet</h3>
          <p className="mt-1 text-sm text-slate-500">Tahsil edilecek veya ödenecek çek/senetleri portföyde izleyin.</p>
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
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-600">Tür</span>
              <select value={type} onChange={(event) => setType(event.target.value as ChequeNoteType)}>
                <option value="CHEQUE">Çek</option>
                <option value="PROMISSORY">Senet</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-600">Yön</span>
              <select value={direction} onChange={(event) => setDirection(event.target.value as ChequeNoteDirection)}>
                <option value="RECEIVED">Alınan</option>
                <option value="ISSUED">Verilen</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-600">Referans no</span>
              <input value={referenceNo} onChange={(event) => setReferenceNo(event.target.value)} required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-600">Tutar</span>
              <input type="number" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required />
            </label>
            {direction === ChequeNoteDirection.RECEIVED ? (
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-600">Müşteri</span>
                <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
                  {customers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} · {item.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-600">Tedarikçi</span>
                <select value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
                  {suppliers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} · {item.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-600">Düzenleme tarihi</span>
              <input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-600">Vade</span>
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-600">Banka</span>
              <input value={bankName} onChange={(event) => setBankName(event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-600">Şube</span>
              <input value={branchName} onChange={(event) => setBranchName(event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-600">Hesap no</span>
              <input value={accountNo} onChange={(event) => setAccountNo(event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-600">Keşideci</span>
              <input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-600">Not</span>
              <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
          </div>
        </section>

        <aside className="rounded-[16px] border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Durum</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{amount ? new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(amount || 0)) : "₺0,00"}</p>
          <p className="mt-1 text-sm text-slate-500">Yeni kayıt portföy statüsüyle açılır.</p>
          {message ? <p className="mt-4 text-sm font-semibold text-emerald-600">{message}</p> : null}
          {error ? <p className="mt-4 text-sm font-semibold text-rose-600">{error}</p> : null}
        </aside>
      </div>
    </form>
  );
}

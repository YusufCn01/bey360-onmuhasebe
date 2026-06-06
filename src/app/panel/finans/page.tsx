import Link from "next/link";
import { AppShell } from "@/components/ui/app-shell";
import { QuickActionLink, SectionCard, StatRow, SummaryCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

export default async function FinancePage() {
  const { membership, tenant, user } = await getTenantContext();
  const [cashAccounts, bankAccounts, payments, expenses] = await Promise.all([
    db.cashAccount.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: "asc" } }),
    db.bankAccount.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: "asc" } }),
    db.payment.findMany({ where: { tenantId: tenant.id }, orderBy: { transactionAt: "desc" }, take: 12, include: { invoice: true } }),
    db.expenseRecord.findMany({ where: { tenantId: tenant.id }, orderBy: { transactionAt: "desc" }, take: 8 }),
  ]);

  const totalCash = cashAccounts.reduce((sum, item) => sum + Number(item.balance), 0);
  const totalBank = bankAccounts.reduce((sum, item) => sum + Number(item.balance), 0);
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalIn = payments.filter((item) => item.direction === "IN").reduce((sum, item) => sum + Number(item.amount), 0);
  const totalOut = payments.filter((item) => item.direction === "OUT").reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <AppShell
      title="Kasa, Banka ve Çek"
      subtitle="Tahsilat, ödeme, banka ve çek benzeri finans hareketlerini gerçek kayıtlarla yönetin"
      currentPath="/panel/finans"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<QuickActionLink href="/panel/finans/tahsilat-odeme/yeni" label="Yeni Tahsilat / Ödeme" />}
    >
      <div className="space-y-6">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Kasa toplamı" value={formatCurrency(totalCash)} detail={`${formatNumber(cashAccounts.length)} kasa hesabı`} accent="border-l-4 border-l-emerald-500 border-[var(--line)]" />
          <SummaryCard title="Banka toplamı" value={formatCurrency(totalBank)} detail={`${formatNumber(bankAccounts.length)} banka hesabı`} accent="border-l-4 border-l-sky-500 border-[var(--line)]" />
          <SummaryCard title="Tahsilat hacmi" value={formatCurrency(totalIn)} detail="Cari ve belge bazlı girişler" accent="border-l-4 border-l-amber-500 border-[var(--line)]" />
          <SummaryCard title="Ödeme hacmi" value={formatCurrency(totalOut)} detail={`Gider toplamı ${formatCurrency(totalExpense)}`} accent="border-l-4 border-l-rose-500 border-[var(--line)]" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
          <SectionCard eyebrow="Finans Özeti" title="Nakit görünümü" action={<Link href="/panel/faturalar" className="text-sm font-bold text-[var(--brand)]">Faturaları aç</Link>}>
            <div className="space-y-3">
              <StatRow label="Toplam nakit" value={formatCurrency(totalCash + totalBank)} />
              <StatRow label="Kasalar" value={formatCurrency(totalCash)} />
              <StatRow label="Bankalar" value={formatCurrency(totalBank)} />
              <StatRow label="Net hareket" value={formatCurrency(totalIn - totalOut)} />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link href="/panel/cari" className="border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-white">Cari bağlantıları gör</Link>
              <Link href="/panel/ayarlar/hizli-bilisim" className="border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-white">Servis ayarları</Link>
            </div>
          </SectionCard>

          <section className="grid gap-6 xl:grid-cols-2">
            <SectionCard eyebrow="Kasa İşlemleri" title="Kasa hesabı oluştur">
              <div className="grid gap-3">
                <Link href="/panel/finans/kasa/yeni" className="border border-[var(--line)] bg-white px-4 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50">Yeni kasa hesabı</Link>
                <Link href="/panel/finans/tahsilat-odeme/yeni" className="border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4 text-sm font-semibold text-slate-700 hover:bg-white">Tahsilat / ödeme işle</Link>
              </div>
            </SectionCard>
            <SectionCard eyebrow="Banka İşlemleri" title="Banka hesabı oluştur">
              <div className="grid gap-3">
                <Link href="/panel/finans/banka/yeni" className="border border-[var(--line)] bg-white px-4 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50">Yeni banka hesabı</Link>
                <Link href="/panel/finans/gider/yeni" className="border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4 text-sm font-semibold text-slate-700 hover:bg-white">Yeni gider işle</Link>
              </div>
            </SectionCard>
          </section>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <SectionCard eyebrow="Finans Aksiyonları" title="Ayrı sayfa akışı">
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/panel/finans/tahsilat-odeme/yeni" className="border border-[var(--line)] bg-white px-4 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50">Yeni tahsilat / ödeme</Link>
              <Link href="/panel/finans/gider/yeni" className="border border-[var(--line)] bg-white px-4 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50">Yeni gider kaydı</Link>
            </div>
          </SectionCard>
          <SectionCard eyebrow="İlgili Modüller" title="Bağlantılı ekranlar">
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/panel/faturalar" className="border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4 text-sm font-semibold text-slate-700 hover:bg-white">Faturalar</Link>
              <Link href="/panel/cari" className="border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4 text-sm font-semibold text-slate-700 hover:bg-white">Cari hesaplar</Link>
            </div>
          </SectionCard>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <SectionCard eyebrow="Kasalar ve Bankalar" title="Hesap listesi">
            <div className="space-y-3">
              {cashAccounts.map((item) => (
                <div key={item.id} className="border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
                  <p className="font-extrabold text-slate-900">{item.name}</p>
                  <p className="mt-2 text-sm text-slate-500">Kasa bakiyesi</p>
                  <p className="mt-1 text-xl font-extrabold text-emerald-700">{formatCurrency(Number(item.balance))}</p>
                </div>
              ))}
              {bankAccounts.map((item) => (
                <div key={item.id} className="border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
                  <p className="font-extrabold text-slate-900">{item.bankName}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.iban}</p>
                  <p className="mt-2 text-xl font-extrabold text-sky-700">{formatCurrency(Number(item.balance))}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard eyebrow="Hareket Akışı" title="Tahsilat ve ödeme kayıtları">
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-extrabold text-slate-900">{payment.description ?? "Finans hareketi"}</p>
                      <p className="mt-1 text-sm text-slate-500">{formatDate(payment.transactionAt)} · {payment.method}</p>
                      <p className="mt-2 text-xs text-slate-500">Belge: {payment.invoice?.invoiceNo ?? "Bağlı değil"}</p>
                    </div>
                    <p className={`text-lg font-extrabold ${payment.direction === "IN" ? "text-emerald-700" : "text-rose-700"}`}>{formatCurrency(Number(payment.amount))}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </section>
      </div>
    </AppShell>
  );
}

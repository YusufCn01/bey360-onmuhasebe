import Link from "next/link";
import { AppShell } from "@/components/ui/app-shell";
import { QuickActionLink, SectionCard, StatusPill } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

export default async function MoneyPage() {
  const { membership, tenant, user } = await getTenantContext();
  const payments = await db.payment.findMany({ where: { tenantId: tenant.id }, orderBy: { transactionAt: "desc" }, take: 50, include: { invoice: true } });

  return (
    <AppShell
      title="Para Hareketleri"
      subtitle="Bu ekran yalnızca tahsilat ve ödeme hareketlerini gösterir. Kasa ve banka hesapları ayrı alt sayfalardadır."
      currentPath="/panel/para"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<QuickActionLink href="/panel/finans/tahsilat-odeme/yeni" label="Yeni Tahsilat / Ödeme" />}
    >
      <SectionCard
        eyebrow="Hareket Listesi"
        title="Tahsilat ve ödeme kayıtları"
        action={<div className="flex gap-2"><Link href="/panel/para/kasalar" className="text-sm font-bold text-[var(--brand)]">Kasalar</Link><Link href="/panel/para/bankalar" className="text-sm font-bold text-[var(--brand)]">Bankalar</Link></div>}
      >
        <div className="space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="rounded-[12px] border border-[var(--line)] bg-white px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold text-slate-900">{payment.description ?? "Finans hareketi"}</p>
                  <p className="mt-1 text-sm text-slate-500">{formatDate(payment.transactionAt)} · {payment.method}</p>
                  <p className="mt-2 text-xs text-slate-500">Belge: {payment.invoice?.invoiceNo ?? "Bağlı değil"}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-extrabold ${payment.direction === "IN" ? "text-emerald-700" : "text-rose-700"}`}>{formatCurrency(Number(payment.amount))}</p>
                  <StatusPill label={payment.direction === "IN" ? "Tahsilat" : "Ödeme"} tone={payment.direction === "IN" ? "emerald" : "rose"} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}

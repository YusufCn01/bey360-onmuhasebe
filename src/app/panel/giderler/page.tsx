import { AppShell } from "@/components/ui/app-shell";
import { QuickActionLink, SectionCard, StatusPill } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

export default async function ExpensesPage() {
  const { membership, tenant, user } = await getTenantContext();
  const expenses = await db.expenseRecord.findMany({ where: { tenantId: tenant.id }, orderBy: { transactionAt: "desc" }, take: 50 });

  return (
    <AppShell
      title="Giderler"
      subtitle="Bu ekran yalnızca gider kayıtlarını gösterir. Yeni gider ekleme işlemi ayrı sayfadan yapılır."
      currentPath="/panel/giderler"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<QuickActionLink href="/panel/finans/gider/yeni" label="Yeni Gider" />}
    >
      <SectionCard eyebrow="Gider Listesi" title="Son gider kayıtları" action={<span className="text-sm font-semibold text-slate-500">Toplam kayıt: {expenses.length}</span>}>
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div key={expense.id} className="rounded-[12px] border border-[var(--line)] bg-white px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold text-slate-900">{expense.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{expense.category} · {formatDate(expense.transactionAt)}</p>
                  {expense.note ? <p className="mt-2 text-sm text-slate-600">{expense.note}</p> : null}
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-rose-700">{formatCurrency(Number(expense.amount))}</p>
                  <StatusPill label="Gider" tone="rose" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}


import { AppShell } from "@/components/ui/app-shell";
import { QuickActionLink, SectionCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

export default async function CashAccountsPage() {
  const { membership, tenant, user } = await getTenantContext();
  const cashAccounts = await db.cashAccount.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: "asc" } });

  return (
    <AppShell
      title="Kasalar"
      subtitle="Bu ekran yalnızca kasa hesaplarını gösterir."
      currentPath="/panel/para/kasalar"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<QuickActionLink href="/panel/finans/kasa/yeni" label="Yeni Kasa" />}
    >
      <SectionCard eyebrow="Kasa Listesi" title="Kasa hesapları" action={<span className="text-sm font-semibold text-slate-500">Toplam kasa: {cashAccounts.length}</span>}>
        <div className="space-y-3">
          {cashAccounts.map((item) => (
            <div key={item.id} className="rounded-[12px] border border-[var(--line)] bg-white px-4 py-4">
              <p className="font-extrabold text-slate-900">{item.name}</p>
              <p className="mt-2 text-sm text-slate-500">Kasa bakiyesi</p>
              <p className="mt-1 text-xl font-extrabold text-emerald-700">{formatCurrency(Number(item.balance))}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}

import { AppShell } from "@/components/ui/app-shell";
import { QuickActionLink, SectionCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

export default async function BankAccountsPage() {
  const { membership, tenant, user } = await getTenantContext();
  const bankAccounts = await db.bankAccount.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: "asc" } });

  return (
    <AppShell
      title="Bankalar"
      subtitle="Bu ekran yalnızca banka hesaplarını gösterir."
      currentPath="/panel/para/bankalar"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<QuickActionLink href="/panel/finans/banka/yeni" label="Yeni Banka" />}
    >
      <SectionCard eyebrow="Banka Listesi" title="Banka hesapları" action={<span className="text-sm font-semibold text-slate-500">Toplam banka: {bankAccounts.length}</span>}>
        <div className="space-y-3">
          {bankAccounts.map((item) => (
            <div key={item.id} className="rounded-[12px] border border-[var(--line)] bg-white px-4 py-4">
              <p className="font-extrabold text-slate-900">{item.bankName}</p>
              <p className="mt-1 text-xs text-slate-500">{item.iban}</p>
              <p className="mt-2 text-sm text-slate-500">Banka bakiyesi</p>
              <p className="mt-1 text-xl font-extrabold text-sky-700">{formatCurrency(Number(item.balance))}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}

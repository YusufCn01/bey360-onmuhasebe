import { PackagePlanManager } from "@/components/forms/package-plan-manager";
import { AppShell } from "@/components/ui/app-shell";
import { SummaryCard } from "@/components/ui/module-blocks";
import { getFounderContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency, formatNumber } from "@/lib/format";
import { founderNavGroups } from "@/lib/navigation";

export default async function PackagePlansPage() {
  const { user } = await getFounderContext();
  const plans = await db.packagePlan.findMany({
    orderBy: [{ isActive: "desc" }, { monthlyPrice: "asc" }, { name: "asc" }],
    include: { _count: { select: { tenants: true, applications: true } } },
  });

  const activePlans = plans.filter((plan) => plan.isActive).length;
  const monthlyAverage = plans.length ? plans.reduce((sum, plan) => sum + Number(plan.monthlyPrice), 0) / plans.length : 0;
  const linkedTenants = plans.reduce((sum, plan) => sum + plan._count.tenants, 0);

  return (
    <AppShell
      title="Paket ve Lisanslar"
      subtitle="Paket planlarını oluşturun, fiyatları yönetin ve tenant dağılımını tek ekranda izleyin."
      currentPath="/kurucu/paketler"
      navGroups={founderNavGroups}
      userName={user.fullName}
      userTitle="Kurucu / Sistem Sahibi"
    >
      <div className="space-y-6">
        <section className="grid gap-5 md:grid-cols-3">
          <SummaryCard title="Toplam paket" value={formatNumber(plans.length)} detail={`${formatNumber(activePlans)} aktif plan`} accent="border-l-4 border-l-sky-500 border-[var(--line)]" />
          <SummaryCard title="Ortalama aylık ücret" value={formatCurrency(monthlyAverage)} detail="Mevcut paket ortalaması" accent="border-l-4 border-l-amber-500 border-[var(--line)]" />
          <SummaryCard title="Bağlı tenant" value={formatNumber(linkedTenants)} detail="Paket atanmış firma hesabı" accent="border-l-4 border-l-emerald-500 border-[var(--line)]" />
        </section>

        <PackagePlanManager
          initialPlans={plans.map((plan) => ({
            id: plan.id,
            code: plan.code,
            name: plan.name,
            monthlyPrice: Number(plan.monthlyPrice),
            yearlyPrice: Number(plan.yearlyPrice),
            userLimit: plan.userLimit,
            branchLimit: plan.branchLimit,
            isActive: plan.isActive,
            tenantsCount: plan._count.tenants,
            applicationsCount: plan._count.applications,
          }))}
        />
      </div>
    </AppShell>
  );
}

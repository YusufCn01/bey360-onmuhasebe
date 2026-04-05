import Link from "next/link";
import { CreateTenantForm } from "@/components/forms/create-tenant-form";
import { AppShell } from "@/components/ui/app-shell";
import { QuickActionLink, SectionCard, StatusPill, SummaryCard } from "@/components/ui/module-blocks";
import { getFounderContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency, formatNumber } from "@/lib/format";
import { founderNavGroups } from "@/lib/navigation";

export default async function FounderPage() {
  const { user } = await getFounderContext();

  const [tenantCount, activeTenantCount, applications, packagePlans, usersCount, recentTenants] = await Promise.all([
    db.tenant.count(),
    db.tenant.count({ where: { status: "ACTIVE" } }),
    db.dealerApplication.findMany({
      orderBy: { createdAt: "desc" },
      include: { packagePlan: true },
      take: 8,
    }),
    db.packagePlan.findMany({
      orderBy: [{ isActive: "desc" }, { monthlyPrice: "asc" }],
      include: { _count: { select: { tenants: true, applications: true } } },
      take: 8,
    }),
    db.user.count(),
    db.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: { branches: true, memberships: true, packagePlan: true },
      take: 5,
    }),
  ]);

  const openApplications = applications.filter((item) => item.status !== "APPROVED").length;
  const recurringRevenue = packagePlans.reduce((sum, plan) => sum + Number(plan.monthlyPrice) * plan._count.tenants, 0);
  const totalProjectedCommission = applications.reduce((sum, application) => {
    if (!application.packagePlan) return sum;
    return sum + Number(application.packagePlan.monthlyPrice) * (Number(application.commissionRate) / 100);
  }, 0);

  const revenueByPlan = packagePlans.map((plan) => ({
    ...plan,
    mrr: Number(plan.monthlyPrice) * plan._count.tenants,
  }));

  const maxPlanMrr = Math.max(...revenueByPlan.map((plan) => plan.mrr), 1);
  const maxCommission = Math.max(
    ...applications.map((application) => Number(application.packagePlan?.monthlyPrice ?? 0) * (Number(application.commissionRate) / 100)),
    1,
  );

  return (
    <AppShell
      title="Kurucu Yönetimi"
      subtitle="Tenant lisanslarını, bayi komisyonlarını ve paket stratejisini tek merkezden yönetin."
      currentPath="/kurucu"
      navGroups={founderNavGroups}
      userName={user.fullName}
      userTitle="Kurucu / Sistem Sahibi"
      topAction={<QuickActionLink href="/kurucu/paketler" label="Paketleri Yönet" />}
    >
      <div className="space-y-6">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Toplam tenant" value={formatNumber(tenantCount)} detail={`${formatNumber(activeTenantCount)} aktif firma`} accent="border-l-4 border-l-sky-500 border-[var(--line)]" />
          <SummaryCard title="Toplam kullanıcı" value={formatNumber(usersCount)} detail="Kurulu hesap sayısı" accent="border-l-4 border-l-amber-500 border-[var(--line)]" />
          <SummaryCard title="Açık başvurular" value={formatNumber(openApplications)} detail={`${formatNumber(applications.length)} toplam bayi kaydı`} accent="border-l-4 border-l-rose-500 border-[var(--line)]" />
          <SummaryCard title="Aylık lisans hacmi" value={formatCurrency(recurringRevenue)} detail="Aktif paket dağılımına göre" accent="border-l-4 border-l-emerald-500 border-[var(--line)]" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <SectionCard eyebrow="Son Tenantlar" title="Yeni açılan firma hesapları" action={<Link href="/kurucu/tenantlar" className="text-sm font-bold text-[var(--brand)]">Tüm tenantlar</Link>}>
            <div className="space-y-3">
              {recentTenants.map((tenant) => (
                <div key={tenant.id} className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-extrabold text-slate-900">{tenant.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{tenant.code} · {tenant.slug}</p>
                    </div>
                    <StatusPill label={tenant.status} tone={tenant.status === "ACTIVE" ? "emerald" : tenant.status === "TRIAL" ? "amber" : "rose"} />
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-[10px] border border-[var(--line)] bg-white px-3 py-2"><span className="text-slate-500">Paket</span><p className="font-extrabold text-slate-800">{tenant.packagePlan?.name ?? tenant.planName}</p></div>
                    <div className="rounded-[10px] border border-[var(--line)] bg-white px-3 py-2"><span className="text-slate-500">Şube</span><p className="font-extrabold text-slate-800">{tenant.branches.length}</p></div>
                    <div className="rounded-[10px] border border-[var(--line)] bg-white px-3 py-2"><span className="text-slate-500">Kullanıcı</span><p className="font-extrabold text-slate-800">{tenant.memberships.length}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <CreateTenantForm
            packagePlans={packagePlans.map((plan) => ({
              id: plan.id,
              code: plan.code,
              name: plan.name,
              monthlyPrice: Number(plan.monthlyPrice),
              userLimit: plan.userLimit,
              branchLimit: plan.branchLimit,
            }))}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <SectionCard eyebrow="MRR Dağılımı" title="Paket bazlı aylık tekrar eden gelir" action={<Link href="/kurucu/paketler" className="text-sm font-bold text-[var(--brand)]">Paket ekranı</Link>}>
            <div className="space-y-4">
              {revenueByPlan.map((plan) => (
                <div key={plan.id} className="space-y-2 rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-extrabold text-slate-900">{plan.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{plan._count.tenants} tenant · {formatCurrency(Number(plan.monthlyPrice))}/ay</p>
                    </div>
                    <p className="text-lg font-black text-slate-900">{formatCurrency(plan.mrr)}</p>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${Math.max((plan.mrr / maxPlanMrr) * 100, 4)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard eyebrow="Komisyon Paneli" title="Bayi başvuru komisyon projeksiyonu" action={<Link href="/kurucu/bayi-basvurulari" className="text-sm font-bold text-[var(--brand)]">Başvuruları aç</Link>}>
            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Tahmini aylık komisyon</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(totalProjectedCommission)}</p>
              </div>
              <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Ortalama komisyon oranı</p>
                <p className="mt-2 text-2xl font-black text-slate-900">%{applications.length ? (applications.reduce((sum, item) => sum + Number(item.commissionRate), 0) / applications.length).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) : "0"}</p>
              </div>
            </div>
            <div className="space-y-3">
              {applications.map((application) => {
                const projectedCommission = Number(application.packagePlan?.monthlyPrice ?? 0) * (Number(application.commissionRate) / 100);
                return (
                  <div key={application.id} className="space-y-2 rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-extrabold text-slate-900">{application.companyName}</p>
                        <p className="mt-1 text-sm text-slate-500">{application.packagePlan?.name ?? "Paket yok"} · %{application.commissionRate.toLocaleString("tr-TR")}</p>
                      </div>
                      <StatusPill label={application.status} tone={application.status === "APPROVED" ? "emerald" : application.status === "REJECTED" ? "rose" : "amber"} />
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max((projectedCommission / maxCommission) * 100, 4)}%` }} />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Tahmini aylık komisyon: {formatCurrency(projectedCommission)}</p>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </section>
      </div>
    </AppShell>
  );
}

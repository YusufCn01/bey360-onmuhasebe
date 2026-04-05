import { CreateTenantForm } from "@/components/forms/create-tenant-form";
import { TenantPlanActions } from "@/components/forms/tenant-plan-actions";
import { AppShell } from "@/components/ui/app-shell";
import { getFounderContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { founderNavGroups } from "@/lib/navigation";

export default async function TenantListPage() {
  const { user } = await getFounderContext();
  const [tenants, packagePlans] = await Promise.all([
    db.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        branches: true,
        memberships: { include: { user: true } },
        packagePlan: true,
      },
    }),
    db.packagePlan.findMany({ where: { isActive: true }, orderBy: [{ monthlyPrice: "asc" }, { name: "asc" }] }),
  ]);

  return (
    <AppShell
      title="Tenantlar"
      subtitle="Tüm firma hesaplarını, lisans paketlerini ve sahip kullanıcılarını tek ekrandan yönetin."
      currentPath="/kurucu/tenantlar"
      navGroups={founderNavGroups}
      userName={user.fullName}
      userTitle="Kurucu / Sistem Sahibi"
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Tenant listesi</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Aktif firma kayıtları</h2>
          </div>
          <div className="mt-5 space-y-4">
            {tenants.map((tenant) => {
              const owner = tenant.memberships.find((item) => item.role === "OWNER")?.user;
              return (
                <div key={tenant.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-900">{tenant.name}</p>
                          <p className="mt-1 text-sm text-slate-500">{tenant.code} · {tenant.slug}</p>
                          <p className="mt-2 text-xs text-slate-500">Sahip: {owner?.fullName ?? "Atanmadı"} · {owner?.email ?? "-"}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">{tenant.status}</span>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-4 text-sm">
                        <div className="rounded-xl bg-white px-3 py-2"><span className="text-slate-500">Plan</span><p className="font-black text-slate-800">{tenant.packagePlan?.name ?? tenant.planName}</p></div>
                        <div className="rounded-xl bg-white px-3 py-2"><span className="text-slate-500">Şube</span><p className="font-black text-slate-800">{tenant.branches.length}</p></div>
                        <div className="rounded-xl bg-white px-3 py-2"><span className="text-slate-500">Kullanıcı</span><p className="font-black text-slate-800">{tenant.memberships.length}</p></div>
                        <div className="rounded-xl bg-white px-3 py-2"><span className="text-slate-500">Açılış</span><p className="font-black text-slate-800">{formatDate(tenant.createdAt)}</p></div>
                      </div>
                    </div>

                    <TenantPlanActions
                      tenantId={tenant.id}
                      currentStatus={tenant.status}
                      currentPackagePlanId={tenant.packagePlanId}
                      packagePlans={packagePlans.map((plan) => ({ id: plan.id, code: plan.code, name: plan.name }))}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

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
      </div>
    </AppShell>
  );
}

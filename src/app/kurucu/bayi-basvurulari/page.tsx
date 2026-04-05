import { DealerReviewButtons } from "@/components/forms/dealer-review-buttons";
import { AppShell } from "@/components/ui/app-shell";
import { getFounderContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { founderNavGroups } from "@/lib/navigation";

export default async function DealerApplicationsPage() {
  const { user } = await getFounderContext();
  const [applications, packagePlans] = await Promise.all([
    db.dealerApplication.findMany({
      orderBy: { createdAt: "desc" },
      include: { tenant: true, packagePlan: true },
    }),
    db.packagePlan.findMany({ where: { isActive: true }, orderBy: [{ monthlyPrice: "asc" }, { name: "asc" }] }),
  ]);

  return (
    <AppShell
      title="Bayi Başvuruları"
      subtitle="Yeni başvuruları değerlendirin, komisyon oranlarını belirleyin ve önerilen paketleri atayın."
      currentPath="/kurucu/bayi-basvurulari"
      navGroups={founderNavGroups}
      userName={user.fullName}
      userTitle="Kurucu / Sistem Sahibi"
    >
      <div className="space-y-4">
        {applications.map((application) => (
          <article key={application.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Başvuru · {formatDate(application.createdAt)}</p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">{application.companyName}</h2>
                <p className="mt-2 text-sm text-slate-500">{application.contactName} · {application.email} · {application.phone}</p>
                <p className="mt-3 text-sm leading-7 text-slate-700">{application.note || "Başvuru notu girilmedi."}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Şehir: {application.city ?? "Belirtilmedi"}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Durum: {application.status}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Komisyon: %{application.commissionRate.toLocaleString("tr-TR")}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Paket: {application.packagePlan?.name ?? "Atanmadı"}</span>
                  {application.tenant ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Tenant: {application.tenant.name}</span> : null}
                </div>
              </div>
              <DealerReviewButtons
                applicationId={application.id}
                currentStatus={application.status}
                currentCommissionRate={Number(application.commissionRate)}
                currentPackagePlanId={application.packagePlanId}
                packagePlans={packagePlans.map((plan) => ({ id: plan.id, code: plan.code, name: plan.name }))}
              />
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}

import { AppShell } from "@/components/ui/app-shell";
import { PackageChangeRequestForm } from "@/components/forms/package-change-request-form";
import { QuickActionLink, SectionCard, SummaryCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

export default async function SubscriptionPage() {
  const { membership, tenant, user } = await getTenantContext();
  const now = new Date();
  const daysUntilTrialEnd = tenant.trialEndsAt
    ? Math.ceil((tenant.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const [plans, openRequest, latestDecision, requestHistory] = await Promise.all([
    db.packagePlan.findMany({ where: { isActive: true }, orderBy: [{ monthlyPrice: "asc" }, { name: "asc" }] }),
    db.packageChangeRequest.findFirst({
      where: { tenantId: tenant.id, status: "OPEN" },
      orderBy: { createdAt: "desc" },
      include: { targetPlan: true },
    }),
    db.packageChangeRequest.findFirst({
      where: { tenantId: tenant.id, status: { in: ["APPROVED", "REJECTED"] } },
      orderBy: { updatedAt: "desc" },
      include: { targetPlan: true },
    }),
    db.packageChangeRequest.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      include: { targetPlan: true },
      take: 8,
    }),
  ]);

  return (
    <AppShell
      title="Abonelik ve Paket"
      subtitle="Mevcut planını görüntüle, üst paketleri incele ve ihtiyaç duyduğunda paket değişim talebi oluştur."
      currentPath="/panel/ayarlar/abonelik"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} · ${tenant.planName}`}
      topAction={<QuickActionLink href="/panel/ayarlar/firma" label="Firma ayarları" />}
    >
      <div className="space-y-6">
        <section className="grid gap-5 md:grid-cols-3">
          <SummaryCard title="Aktif plan" value={tenant.planName} detail="Şu an kullanılan lisans" accent="border-l-4 border-l-sky-500 border-[var(--line)]" />
          <SummaryCard title="Durum" value={tenant.status} detail="Firma abonelik durumu" accent="border-l-4 border-l-emerald-500 border-[var(--line)]" />
          <SummaryCard
            title="Açık talep"
            value={openRequest ? openRequest.targetPlan.name : "Yok"}
            detail={openRequest ? "Değerlendirme bekliyor" : "Bekleyen değişim yok"}
            accent={`border-l-4 ${openRequest ? "border-l-amber-500" : "border-l-slate-400"} border-[var(--line)]`}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div
            className={`rounded-[22px] border px-5 py-4 text-sm ${
              tenant.status === "TRIAL" && daysUntilTrialEnd !== null && daysUntilTrialEnd <= 3
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : tenant.status === "TRIAL"
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-sky-200 bg-sky-50 text-sky-800"
            }`}
          >
            <p className="font-extrabold">
              {tenant.status === "TRIAL"
                ? daysUntilTrialEnd !== null && daysUntilTrialEnd <= 0
                  ? "Deneme süresi sona erdi"
                  : `Deneme süresi${daysUntilTrialEnd !== null ? ` · ${daysUntilTrialEnd} gün kaldı` : ""}`
                : "Abonelik durumu aktif"}
            </p>
            <p className="mt-1 leading-6">
              {tenant.status === "TRIAL"
                ? "Kullanımın kesintiye uğramasın diye uygun pakete geçiş talebini bu ekrandan oluşturabilirsin."
                : "Planın aktif görünüyor. Kullanıcı veya şube ihtiyacın artarsa üst pakete geçiş talebi bırakabilirsin."}
            </p>
            {tenant.trialEndsAt ? <p className="mt-2 font-medium">Bitiş tarihi: {formatDate(tenant.trialEndsAt)}</p> : null}
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">
            <p className="font-extrabold text-slate-900">Ödeme ve geçiş bilgisi</p>
            <p className="mt-1 leading-6">
              Paket değişimleri şu an onay akışıyla ilerliyor. Talep oluşturduğunda ekip planını kontrol eder, sonucu ve varsa notu sana bildirim olarak iletir.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2">Son kullanıcı: {user.fullName}</div>
              <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2">Durum: {openRequest ? "Talep açık" : "Yeni talep açılabilir"}</div>
            </div>
          </div>
        </section>

        {latestDecision ? (
          <div
            className={`rounded-[22px] border px-5 py-4 text-sm ${
              latestDecision.status === "APPROVED"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            <p className="font-extrabold">
              {latestDecision.status === "APPROVED" ? "Son talebin onaylandı" : "Son talebin sonuçlandı"}
            </p>
            <p className="mt-1">
              {latestDecision.targetPlan.name} planı için açılan talep{" "}
              {latestDecision.status === "APPROVED"
                ? "aktif hale getirildi. Yeni limitler artık kullanılabilir."
                : "şu an için onaylanmadı. İstersen not ekleyerek tekrar talep oluşturabilirsin."}
            </p>
            {latestDecision.reviewNote ? <p className="mt-2 font-medium">Kurucu notu: {latestDecision.reviewNote}</p> : null}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
          <SectionCard eyebrow="Paketler" title="Kullanıma açık planlar">
            <div className="grid gap-4 lg:grid-cols-2">
              {plans.map((plan) => {
                const isCurrent = tenant.packagePlanId === plan.id || tenant.planName === plan.name;
                return (
                  <div key={plan.id} className={`rounded-[22px] border p-5 ${isCurrent ? "border-[var(--brand)] bg-[var(--brand-ghost)]" : "border-slate-200 bg-white"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-extrabold text-slate-950">{plan.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{plan.code}</p>
                      </div>
                      {isCurrent ? <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--brand)]">Aktif</span> : null}
                    </div>
                    <p className="mt-4 text-2xl font-black text-slate-950">{formatCurrency(Number(plan.monthlyPrice))}</p>
                    <p className="mt-1 text-sm text-slate-500">Aylık ücret</p>
                    <div className="mt-4 grid gap-2 text-sm text-slate-600">
                      <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2">{plan.userLimit} kullanıcı</div>
                      <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2">{plan.branchLimit} şube</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard eyebrow="Paket Talebi" title="Plan değişikliği iste">
            {openRequest ? (
              <div className="mb-5 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                <p className="font-extrabold">Açık bir talebin var.</p>
                <p className="mt-1">Hedef paket: {openRequest.targetPlan.name}</p>
              </div>
            ) : null}

            <PackageChangeRequestForm
              currentPlanId={tenant.packagePlanId}
              plans={plans.map((plan) => ({
                id: plan.id,
                name: plan.name,
                monthlyPrice: Number(plan.monthlyPrice),
                userLimit: plan.userLimit,
                branchLimit: plan.branchLimit,
              }))}
            />
          </SectionCard>
        </section>

        <SectionCard eyebrow="Talep Geçmişi" title="Son paket değişim kayıtları">
          {requestHistory.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-[var(--line)] bg-[var(--panel-soft)] px-4 py-8 text-center text-sm text-slate-500">
              Henüz bir paket değişim talebi bulunmuyor.
            </div>
          ) : (
            <div className="space-y-3">
              {requestHistory.map((item) => (
                <div key={item.id} className="rounded-[18px] border border-slate-200 bg-white px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-extrabold text-slate-900">{item.targetPlan.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.currentPlanName} → {item.targetPlan.name}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
                        item.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-700"
                          : item.status === "REJECTED"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                    <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2">Talep: {formatDate(item.createdAt)}</div>
                    <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2">Son işlem: {item.reviewedAt ? formatDate(item.reviewedAt) : "-"}</div>
                    <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2">Yetkili: {item.reviewedByName ?? "-"}</div>
                  </div>
                  {item.note ? <p className="mt-3 text-sm text-slate-600">Talep notu: {item.note}</p> : null}
                  {item.reviewNote ? <p className="mt-1 text-sm font-medium text-slate-700">Kurucu notu: {item.reviewNote}</p> : null}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}

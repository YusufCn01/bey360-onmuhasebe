import Link from "next/link";
import { AppShell } from "@/components/ui/app-shell";
import { canManageTenantUsers, getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { tenantNavGroups } from "@/lib/navigation";

export default async function TeamPage() {
  const { membership, tenant, user } = await getTenantContext();
  const memberships = await db.membership.findMany({
    where: { tenantId: tenant.id },
    include: { user: true, branch: true },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return (
    <AppShell
      title="Ekip Yönetimi"
      subtitle={`${tenant.name} tenantı içindeki kullanıcılar, roller ve şube erişimleri`}
      currentPath="/panel/ekip"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={
        canManageTenantUsers(membership.role) ? (
          <Link href="/panel/ekip/yeni" className="inline-flex h-10 items-center rounded-[10px] bg-[var(--brand)] px-4 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(213,32,42,0.18)] hover:bg-[var(--brand-strong)]">
            Yeni Ekip Üyesi
          </Link>
        ) : undefined
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Kullanıcı Listesi</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Tenant ekip üyeleri</h2>
          </div>
          <div className="mt-5 space-y-3">
            {memberships.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900">{item.user.fullName}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.user.email}</p>
                    <p className="mt-2 text-xs text-slate-500">Şube: {item.branch?.name ?? "Tüm şubeler"}</p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">{item.role}</span>
                    <p className={`mt-2 text-xs font-semibold ${item.user.isActive ? "text-emerald-600" : "text-rose-600"}`}>{item.user.isActive ? "Aktif" : "Pasif"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        {canManageTenantUsers(membership.role) ? (
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Kullanıcı İşlemi</p>
            <h3 className="mt-2 text-xl font-black text-slate-900">Yeni kullanıcı ekleme ayrı sayfada</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">Liste ekranı ile kayıt ekranını ayırdık. Yeni ekip üyesi eklemek için ayrı sayfaya geçin.</p>
            <Link href="/panel/ekip/yeni" className="mt-4 inline-flex rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-black text-white hover:bg-[var(--brand-strong)]">
              Yeni ekip üyesi ekle
            </Link>
          </article>
        ) : (
          <article className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Yetki sınırı</p>
            <h3 className="mt-2 text-xl font-black text-amber-900">Bu alan için yönetici yetkisi gerekli</h3>
            <p className="mt-3 text-sm leading-7 text-amber-800">Ekip kullanıcıları eklemek veya rol değiştirmek için tenant içinde OWNER ya da ADMIN rolünde olmanız gerekir.</p>
          </article>
        )}
      </div>
    </AppShell>
  );
}

import Link from "next/link";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { tenantNavGroups } from "@/lib/navigation";

export default async function CustomersHubPage() {
  const { membership, tenant, user } = await getTenantContext();

  return (
    <AppShell
      title="Müşteri & Tedarikçi"
      subtitle="Müşteri ve tedarikçi işlemleri ayrı alt sayfalarda yönetilir. İlgili listeyi seçerek sade akışla devam edin."
      currentPath="/panel/cari"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
    >
      <SectionCard eyebrow="Liste Seçimi" title="Hangi kayıt türünü yönetmek istiyorsunuz?">
        <div className="grid gap-4 lg:grid-cols-2">
          <Link href="/panel/cari/musteriler" className="rounded-[18px] border border-[var(--line)] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(15,23,42,0.09)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Müşteri</p>
            <h3 className="mt-2 text-[1.5rem] font-extrabold text-slate-900">Müşteri listesi</h3>
            <p className="mt-2 text-sm text-slate-500">Satış tarafında kullanılacak müşteri kartlarını liste, Excel ve yeni kayıt aksiyonlarıyla yönetin.</p>
          </Link>
          <Link href="/panel/cari/tedarikciler" className="rounded-[18px] border border-[var(--line)] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(15,23,42,0.09)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Tedarikçi</p>
            <h3 className="mt-2 text-[1.5rem] font-extrabold text-slate-900">Tedarikçi listesi</h3>
            <p className="mt-2 text-sm text-slate-500">Alış tarafında kullanılacak tedarikçi kartlarını ayrı, temiz bir listede yönetin.</p>
          </Link>
        </div>
      </SectionCard>
    </AppShell>
  );
}

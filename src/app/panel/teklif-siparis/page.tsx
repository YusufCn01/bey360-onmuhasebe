import Link from "next/link";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { tenantNavGroups } from "@/lib/navigation";

export default async function QuotesOrdersPage() {
  const { membership, tenant, user } = await getTenantContext();

  return (
    <AppShell
      title="Teklif & Sipariş"
      subtitle="Teklif ve sipariş işlemleri artık ayrı sayfalara ayrıldı. Devam etmek istediğiniz akışı seçin."
      currentPath="/panel/teklif-siparis"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
    >
      <SectionCard eyebrow="Akış Seçimi" title="Hangi işlemi açmak istiyorsunuz?">
        <div className="grid gap-4 lg:grid-cols-2">
          <Link href="/panel/teklifler" className="rounded-[16px] border border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] hover:bg-slate-50">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Teklif</p>
            <h3 className="mt-2 text-[1.5rem] font-extrabold text-slate-900">Teklif listesi</h3>
            <p className="mt-2 text-sm text-slate-500">Mevcut teklifleri görüntüleyin, düzenleyin veya siparişe dönüştürün.</p>
          </Link>
          <Link href="/panel/siparisler" className="rounded-[16px] border border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] hover:bg-slate-50">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Sipariş</p>
            <h3 className="mt-2 text-[1.5rem] font-extrabold text-slate-900">Sipariş listesi</h3>
            <p className="mt-2 text-sm text-slate-500">Mevcut siparişleri görüntüleyin, düzenleyin veya faturaya dönüştürün.</p>
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link href="/panel/teklif-siparis/teklif/yeni" className="rounded-[10px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4 text-sm font-bold text-slate-700 hover:bg-white">Yeni teklif oluştur</Link>
          <Link href="/panel/teklif-siparis/siparis/yeni" className="rounded-[10px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4 text-sm font-bold text-slate-700 hover:bg-white">Yeni sipariş oluştur</Link>
        </div>
      </SectionCard>
    </AppShell>
  );
}

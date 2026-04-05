import Link from "next/link";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { tenantNavGroups } from "@/lib/navigation";

export default async function NewInvoicePage() {
  const { membership, tenant, user } = await getTenantContext();

  return (
    <AppShell
      title="Yeni Fatura"
      subtitle="Satış ve alış fatura girişleri ayrı sayfalardan ilerler. Satış tarafında toptan ve perakende akışı ayrıdır."
      currentPath="/panel/faturalar"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={<Link href="/panel/faturalar" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">Fatura Merkezi</Link>}
    >
      <SectionCard eyebrow="Belge Tipi" title="Hangi fatura ile devam edeceksiniz?">
        <div className="grid gap-4 lg:grid-cols-3">
          <Link href="/panel/satis-faturalari/yeni" className="rounded-[16px] border border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] hover:bg-slate-50">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Satışlar</p>
            <h3 className="mt-2 text-[1.5rem] font-extrabold text-slate-900">Toptan Satış Faturası</h3>
            <p className="mt-2 text-sm text-slate-500">KDV hariç kurgu ile satış faturası oluştur.</p>
          </Link>
          <Link href="/panel/satis-faturalari/perakende-yeni" className="rounded-[16px] border border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] hover:bg-slate-50">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Satışlar</p>
            <h3 className="mt-2 text-[1.5rem] font-extrabold text-slate-900">Perakende Satış Faturası</h3>
            <p className="mt-2 text-sm text-slate-500">KDV dahil fiyat ile perakende belge oluştur.</p>
          </Link>
          <Link href="/panel/alis-faturalari/yeni" className="rounded-[16px] border border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] hover:bg-slate-50">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Alışlar</p>
            <h3 className="mt-2 text-[1.5rem] font-extrabold text-slate-900">Alış Faturası</h3>
            <p className="mt-2 text-sm text-slate-500">Tedarikçi bazlı alış faturasını ayrı ekrandan gir.</p>
          </Link>
        </div>
      </SectionCard>
    </AppShell>
  );
}

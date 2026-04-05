import Link from "next/link";
import { ProductExcelActions } from "@/components/forms/product-excel-actions";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard, StatusPill, SummaryCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { tenantNavGroups } from "@/lib/navigation";

export default async function ProductExcelPage() {
  const { membership, tenant, user } = await getTenantContext();

  return (
    <AppShell
      title="Ürün Excel İşlemleri"
      subtitle="Toplu ürün aktarımı ve dışa aktarma işlemlerini ayrı ekrandan yönetin. Ana stok listesi sade kalır."
      currentPath="/panel/stok/excel"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={
        <Link href="/panel/stok" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">
          Stok Listesi
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-3">
          <SummaryCard title="İçe Aktarım" value="Excel" detail="Kod, barkod, kategori, marka, görsel ve fiyat alanları tek seferde yüklenir." accent="border-blue-200" />
          <SummaryCard title="Dışa Aktarım" value="Anlık" detail="Mevcut ürün kartları çalıştığınız başlık düzeniyle dışa alınır." accent="border-emerald-200" />
          <SummaryCard title="Veri Alanı" value="15" detail="Ürün kimliği, fiyatlar, stok, KDV ve açıklama birlikte taşınır." accent="border-amber-200" />
        </div>

        <SectionCard eyebrow="Toplu İşlem" title="Ürün Excel merkezi" action={<StatusPill label="Ayrı ekran" tone="blue" />}>
          <ProductExcelActions />
        </SectionCard>
      </div>
    </AppShell>
  );
}

import Link from "next/link";
import { ProductPriceBulkActions } from "@/components/forms/product-price-bulk-actions";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard, StatusPill, SummaryCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { tenantNavGroups } from "@/lib/navigation";

export default async function ProductBulkPricePage() {
  const { membership, tenant, user } = await getTenantContext();

  return (
    <AppShell
      title="Toplu Fiyat Güncelleme"
      subtitle="Ürün satış ve alış fiyatlarını Excel üzerinden ayrı ekranda güncelleyin. Ana stok ekranı operasyon için temiz kalsın."
      currentPath="/panel/stok/toplu-fiyat"
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
          <SummaryCard title="Eşleştirme" value="Kod / Barkod" detail="Toplu fiyat güncelleme önce ürün koduna, sonra barkoda göre çalışır." accent="border-blue-200" />
          <SummaryCard title="Fiyat Kademe" value="4+1" detail="Dört satış fiyatı ve bir alış fiyatı aynı dosyada güncellenir." accent="border-emerald-200" />
          <SummaryCard title="Kullanım" value="Hızlı" detail="Önce mevcut fiyat listesini indirip aynı dosya üstünden düzenlemeniz yeterli." accent="border-amber-200" />
        </div>

        <SectionCard eyebrow="Toplu İşlem" title="Fiyat güncelleme merkezi" action={<StatusPill label="Ayrı ekran" tone="amber" />}>
          <ProductPriceBulkActions />
        </SectionCard>
      </div>
    </AppShell>
  );
}

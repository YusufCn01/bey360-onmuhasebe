import Link from "next/link";
import { ProductForm } from "@/components/forms/product-form";
import { AppShell } from "@/components/ui/app-shell";
import { getTenantContext } from "@/lib/access";
import { tenantNavGroups } from "@/lib/navigation";

export default async function NewProductPage() {
  const { membership, tenant, user } = await getTenantContext();

  return (
    <AppShell
      title="Yeni Ürün veya Hizmet"
      subtitle="Ürün kartını Logo İşbaşı benzeri sade bir kayıt ekranında oluşturun. Kod, barkod, marka, kategori, görsel, fiyat, birim, stok ve KDV alanları aynı akışta yönetilir."
      currentPath="/panel/stok"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={
        <Link href="/panel/stok" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">
          Stok Listesi
        </Link>
      }
    >
      <ProductForm />
    </AppShell>
  );
}

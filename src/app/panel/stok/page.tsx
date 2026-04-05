/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { EntityDialogActions } from "@/components/actions/entity-dialog-actions";
import { AppShell } from "@/components/ui/app-shell";
import { QuickActionLink, SectionCard, StatusPill } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency, formatNumber } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

export default async function StockPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { membership, tenant, user } = await getTenantContext();
  const params = (await searchParams) ?? {};
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const products = await db.product.findMany({ where: { tenantId: tenant.id }, orderBy: [{ stockQty: "asc" }, { name: "asc" }] });
  const lowStockCount = products.filter((product) => Number(product.stockQty) <= 15).length;
  const totalStock = products.reduce((sum, product) => sum + Number(product.stockQty), 0);

  const filteredProducts = products.filter((product) => {
    return (
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.code.toLowerCase().includes(query) ||
      product.unit.toLowerCase().includes(query) ||
      (product.barcode ?? "").toLowerCase().includes(query) ||
      (product.description ?? "").toLowerCase().includes(query) ||
      (product.brand ?? "").toLowerCase().includes(query) ||
      (product.category ?? "").toLowerCase().includes(query)
    );
  });

  return (
    <AppShell
      title="Stok & Hizmet"
      subtitle="Bu ekran yalnızca ürün ve hizmet kartlarını gösterir. Excel ve toplu fiyat işlemleri ayrı sayfalarda açılır."
      currentPath="/panel/stok"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={
        <div className="flex flex-wrap gap-2">
          <Link href="/panel/stok/excel" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">
            Excel İşlemleri
          </Link>
          <Link href="/panel/stok/toplu-fiyat" className="inline-flex h-10 items-center rounded-[10px] border border-amber-200 bg-amber-50 px-4 text-sm font-extrabold text-amber-700 hover:bg-amber-100">
            Toplu Fiyat
          </Link>
          <QuickActionLink href="/panel/stok/yeni" label="Yeni Ürün" />
        </div>
      }
    >
      <SectionCard eyebrow="Ürün Listesi" title="Stok ve hizmet kartları" action={<Link href="/panel/stok" className="text-sm font-bold text-[var(--brand)]">Filtreyi temizle</Link>}>
        <div className="mb-5 grid gap-3 lg:grid-cols-3">
          <div className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Toplam Kart</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{products.length}</p>
          </div>
          <div className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Düşük Stok</p>
            <p className="mt-2 text-2xl font-extrabold text-amber-600">{lowStockCount}</p>
          </div>
          <div className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Toplam Miktar</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{formatNumber(totalStock)}</p>
          </div>
        </div>

        <form className="mb-5 grid gap-3 rounded-[12px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 lg:grid-cols-[1.4fr_auto]">
          <input name="q" defaultValue={query} placeholder="Ürün, kod, barkod, açıklama, marka, kategori veya birim ara" />
          <button className="rounded-[10px] bg-[var(--brand)] px-4 py-3 text-sm font-extrabold text-white hover:bg-[var(--brand-strong)]">Filtrele</button>
        </form>

        <div className="space-y-4 lg:hidden">
          {filteredProducts.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-[var(--line)] bg-white px-4 py-10 text-center text-sm text-slate-500">
              Aramanıza uygun ürün bulunamadı.
            </div>
          ) : (
            filteredProducts.map((product) => (
              <article key={product.id} className="rounded-[20px] border border-[var(--line)] bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
                <div className="flex items-start gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[16px] border border-[var(--line)] bg-white">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f8fafc_0%,#fee2e2_100%)] text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        Görsel
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-extrabold text-slate-900">{product.name}</p>
                      <StatusPill label={Number(product.stockQty) <= 15 ? "Düşük stok" : "Normal"} tone={Number(product.stockQty) <= 15 ? "amber" : "emerald"} />
                    </div>
                    <p className="mt-1 font-mono text-xs font-semibold text-slate-500">{product.code}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">{product.description || "Açıklama girilmedi"}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Stok</p>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">{formatNumber(Number(product.stockQty))} {product.unit}</p>
                  </div>
                  <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Barkod</p>
                    <p className="mt-1 truncate font-mono text-sm font-semibold text-slate-700">{product.barcode || "-"}</p>
                  </div>
                  <div className="rounded-[14px] border border-emerald-100 bg-emerald-50 px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-500">Satış</p>
                    <p className="mt-1 text-sm font-extrabold text-emerald-700">{formatCurrency(Number(product.salePrice))}</p>
                  </div>
                  <div className="rounded-[14px] border border-amber-100 bg-amber-50 px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-500">Alış / KDV</p>
                    <p className="mt-1 text-sm font-extrabold text-amber-700">{formatCurrency(Number(product.purchasePrice))}</p>
                    <p className="text-[11px] text-amber-600">%{Number(product.vatRate)} KDV</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-1.5 font-semibold text-slate-600">
                    Marka: {product.brand || "-"}
                  </span>
                  <span className="rounded-full border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-1.5 font-semibold text-slate-600">
                    Kategori: {product.category || "Yok"}
                  </span>
                  <span className="rounded-full border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-1.5 font-semibold text-slate-600">
                    S2: {formatCurrency(Number(product.salePrice2))}
                  </span>
                  <span className="rounded-full border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-1.5 font-semibold text-slate-600">
                    S3: {formatCurrency(Number(product.salePrice3))}
                  </span>
                  <span className="rounded-full border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-1.5 font-semibold text-slate-600">
                    S4: {formatCurrency(Number(product.salePrice4))}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/panel/faturalar/yeni" className="rounded-[10px] border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-[var(--panel-soft)]">
                    Faturada kullan
                  </Link>
                  <EntityDialogActions
                    title={product.name}
                    endpoint={`/api/panel/products/${product.id}`}
                    deleteLabel="Ürün kartı"
                    initialData={{
                      code: product.code,
                      name: product.name,
                      barcode: product.barcode ?? "",
                      description: product.description ?? "",
                      category: product.category ?? "",
                      brand: product.brand ?? "",
                      unit: product.unit,
                      salePrice: String(Number(product.salePrice)),
                      salePrice2: String(Number(product.salePrice2)),
                      salePrice3: String(Number(product.salePrice3)),
                      salePrice4: String(Number(product.salePrice4)),
                      purchasePrice: String(Number(product.purchasePrice)),
                      stockQty: String(Number(product.stockQty)),
                      vatRate: String(Number(product.vatRate)),
                    }}
                    fields={[
                      { key: "code", label: "Ürün kodu" },
                      { key: "name", label: "Ürün / hizmet adı" },
                      { key: "barcode", label: "Barkod" },
                      { key: "category", label: "Kategori" },
                      { key: "brand", label: "Marka" },
                      { key: "description", label: "Açıklama", type: "textarea" },
                      { key: "unit", label: "Birim", options: ["Adet", "Kg", "Litre", "Paket", "Hizmet", "Koli"] },
                      { key: "salePrice", label: "Satış fiyatı", type: "number" },
                      { key: "salePrice2", label: "Satış fiyatı 2", type: "number" },
                      { key: "salePrice3", label: "Satış fiyatı 3", type: "number" },
                      { key: "salePrice4", label: "Satış fiyatı 4", type: "number" },
                      { key: "purchasePrice", label: "Alış fiyatı", type: "number" },
                      { key: "stockQty", label: "Stok miktarı", type: "number" },
                      { key: "vatRate", label: "KDV oranı", type: "number" },
                    ]}
                  />
                </div>
              </article>
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1280px] text-left text-sm">
            <thead className="bg-[var(--panel-soft)] text-[11px] uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Ürün</th>
                <th className="px-4 py-3">Kod</th>
                <th className="px-4 py-3">Barkod / Birim</th>
                <th className="px-4 py-3">Marka / Kategori</th>
                <th className="px-4 py-3">Stok</th>
                <th className="px-4 py-3">Satış fiyatları</th>
                <th className="px-4 py-3">Alış / KDV</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 overflow-hidden rounded-[14px] border border-[var(--line)] bg-white">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f8fafc_0%,#fee2e2_100%)] text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                            Görsel
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{product.name}</div>
                        <div className="mt-1 max-w-[280px] truncate text-xs text-slate-500">{product.description || "Açıklama girilmedi"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono font-semibold text-slate-900">{product.code}</td>
                  <td className="px-4 py-4 text-slate-600">
                    <div className="font-mono text-xs text-slate-700">{product.barcode || "-"}</div>
                    <div className="mt-1 text-xs">{product.unit}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    <div className="font-semibold text-slate-900">{product.brand || "-"}</div>
                    <div className="mt-1 text-xs">{product.category || "Kategori yok"}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    <div className="font-semibold">{formatNumber(Number(product.stockQty))}</div>
                    <div className="mt-1 text-xs text-slate-500">{product.unit}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="font-extrabold text-slate-900">S1: {formatCurrency(Number(product.salePrice))}</div>
                      <div className="text-xs text-slate-500">S2: {formatCurrency(Number(product.salePrice2))}</div>
                      <div className="text-xs text-slate-500">S3: {formatCurrency(Number(product.salePrice3))}</div>
                      <div className="text-xs text-slate-500">S4: {formatCurrency(Number(product.salePrice4))}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    <div className="font-semibold">{formatCurrency(Number(product.purchasePrice))}</div>
                    <div className="mt-1 text-xs text-slate-500">%{Number(product.vatRate)} KDV</div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill label={Number(product.stockQty) <= 15 ? "Düşük stok" : "Normal"} tone={Number(product.stockQty) <= 15 ? "amber" : "emerald"} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link href="/panel/faturalar/yeni" className="rounded-[8px] border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[var(--panel-soft)]">Faturada kullan</Link>
                      <EntityDialogActions
                        title={product.name}
                        endpoint={`/api/panel/products/${product.id}`}
                        deleteLabel="Ürün kartı"
                        initialData={{
                          code: product.code,
                          name: product.name,
                          barcode: product.barcode ?? "",
                          description: product.description ?? "",
                          category: product.category ?? "",
                          brand: product.brand ?? "",
                          unit: product.unit,
                          salePrice: String(Number(product.salePrice)),
                          salePrice2: String(Number(product.salePrice2)),
                          salePrice3: String(Number(product.salePrice3)),
                          salePrice4: String(Number(product.salePrice4)),
                          purchasePrice: String(Number(product.purchasePrice)),
                          stockQty: String(Number(product.stockQty)),
                          vatRate: String(Number(product.vatRate)),
                        }}
                        fields={[
                          { key: "code", label: "Ürün kodu" },
                          { key: "name", label: "Ürün / hizmet adı" },
                          { key: "barcode", label: "Barkod" },
                          { key: "category", label: "Kategori" },
                          { key: "brand", label: "Marka" },
                          { key: "description", label: "Açıklama", type: "textarea" },
                          { key: "unit", label: "Birim", options: ["Adet", "Kg", "Litre", "Paket", "Hizmet", "Koli"] },
                          { key: "salePrice", label: "Satış fiyatı", type: "number" },
                          { key: "salePrice2", label: "Satış fiyatı 2", type: "number" },
                          { key: "salePrice3", label: "Satış fiyatı 3", type: "number" },
                          { key: "salePrice4", label: "Satış fiyatı 4", type: "number" },
                          { key: "purchasePrice", label: "Alış fiyatı", type: "number" },
                          { key: "stockQty", label: "Stok miktarı", type: "number" },
                          { key: "vatRate", label: "KDV oranı", type: "number" },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </AppShell>
  );
}




/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { EntityDialogActions } from "@/components/actions/entity-dialog-actions";
import { AppShell } from "@/components/ui/app-shell";
import { MobileActionChips, MobileFilterBar, MobileHeroPanel, MobileStatStrip } from "@/components/ui/mobile-native-blocks";
import { QuickActionLink, SectionCard, StatusPill } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency, formatNumber } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

type ProductRow = Awaited<ReturnType<typeof db.product.findMany>>[number];

function ProductCard({ product }: { product: ProductRow }) {
  return (
    <article className="border border-[var(--line)] bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden border border-[var(--line)] bg-white">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f8fafc_0%,#e0f2fe_100%)] text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Kart
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-extrabold text-slate-900">{product.name}</p>
            <StatusPill label={product.kind === "SERVICE" ? "Hizmet" : "Ürün"} tone={product.kind === "SERVICE" ? "blue" : "slate"} />
            {product.kind === "PRODUCT" ? <StatusPill label={Number(product.stockQty) <= 15 ? "Düşük stok" : "Normal"} tone={Number(product.stockQty) <= 15 ? "amber" : "emerald"} /> : null}
          </div>
          <p className="mt-1 font-mono text-xs font-semibold text-slate-500">{product.code}</p>
          <p className="mt-2 line-clamp-2 text-sm text-slate-500">{product.description || "Açıklama girilmedi"}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{product.kind === "SERVICE" ? "Tür" : "Stok"}</p>
          <p className="mt-1 text-sm font-extrabold text-slate-900">
            {product.kind === "SERVICE" ? "Hizmet kartı" : `${formatNumber(Number(product.stockQty))} ${product.unit}`}
          </p>
        </div>
        <div className="border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Barkod</p>
          <p className="mt-1 truncate font-mono text-sm font-semibold text-slate-700">{product.barcode || "-"}</p>
        </div>
        <div className="border border-emerald-100 bg-emerald-50 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-500">Satış</p>
          <p className="mt-1 text-sm font-extrabold text-emerald-700">{formatCurrency(Number(product.salePrice))}</p>
        </div>
        <div className="border border-amber-100 bg-amber-50 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-500">{product.kind === "SERVICE" ? "Tevkifat / KDV" : "Alış / KDV"}</p>
          <p className="mt-1 text-sm font-extrabold text-amber-700">
            {product.kind === "SERVICE" ? `%${Number(product.withholdingRate ?? 0)}` : formatCurrency(Number(product.purchasePrice))}
          </p>
          <p className="text-[11px] text-amber-600">%{Number(product.vatRate)} KDV</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-1.5 font-semibold text-slate-600">
          Marka: {product.brand || "-"}
        </span>
        <span className="border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-1.5 font-semibold text-slate-600">
          Kategori: {product.category || "Yok"}
        </span>
        {product.kind === "SERVICE" ? (
          <span className="border border-sky-100 bg-sky-50 px-3 py-1.5 font-semibold text-sky-700">
            Kod: {product.withholdingCode || "-"}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/panel/faturalar/yeni" className="border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-[var(--panel-soft)]">
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
            kind: product.kind,
            withholdingRate: String(Number(product.withholdingRate ?? 0)),
            withholdingCode: product.withholdingCode ?? "",
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
            { key: "kind", label: "Kart türü", options: ["PRODUCT", "SERVICE"] },
            { key: "category", label: "Kategori" },
            { key: "brand", label: "Marka" },
            { key: "withholdingRate", label: "Tevkifat oranı", type: "number" },
            { key: "withholdingCode", label: "Tevkifat kodu" },
            { key: "description", label: "Açıklama", type: "textarea" },
            { key: "unit", label: "Birim", options: ["Adet", "Kg", "Litre", "Paket", "Hizmet", "Koli", "Saat", "Gün"] },
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
  );
}

function ProductTable({ items }: { items: ProductRow[] }) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full min-w-[1280px] text-left text-sm">
        <thead className="bg-[var(--panel-soft)] text-[11px] uppercase tracking-[0.14em] text-slate-500">
          <tr>
            <th className="px-4 py-3">Kart</th>
            <th className="px-4 py-3">Kod</th>
            <th className="px-4 py-3">Barkod / Birim</th>
            <th className="px-4 py-3">Marka / Kategori</th>
            <th className="px-4 py-3">Durum</th>
            <th className="px-4 py-3">Satış</th>
            <th className="px-4 py-3">Vergi</th>
            <th className="px-4 py-3">İşlem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)]">
          {items.map((product) => (
            <tr key={product.id} className="hover:bg-slate-50/80">
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 overflow-hidden border border-[var(--line)] bg-white">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f8fafc_0%,#e0f2fe_100%)] text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        Kart
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
              <td className="px-4 py-4">
                <div className="flex flex-col gap-2">
                  <StatusPill label={product.kind === "SERVICE" ? "Hizmet" : "Ürün"} tone={product.kind === "SERVICE" ? "blue" : "slate"} />
                  {product.kind === "PRODUCT" ? (
                    <span className="text-xs text-slate-500">{formatNumber(Number(product.stockQty))} {product.unit}</span>
                  ) : (
                    <span className="text-xs text-slate-500">Stok takibi yok</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="space-y-1">
                  <div className="font-extrabold text-slate-900">S1: {formatCurrency(Number(product.salePrice))}</div>
                  <div className="text-xs text-slate-500">S2: {formatCurrency(Number(product.salePrice2))}</div>
                </div>
              </td>
              <td className="px-4 py-4 text-slate-700">
                <div className="font-semibold">%{Number(product.vatRate)} KDV</div>
                <div className="mt-1 text-xs text-slate-500">
                  {product.kind === "SERVICE" ? `Tevkifat %${Number(product.withholdingRate ?? 0)} · Kod ${product.withholdingCode || "-"}` : formatCurrency(Number(product.purchasePrice))}
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <Link href="/panel/faturalar/yeni" className="border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[var(--panel-soft)]">Faturada kullan</Link>
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
                      kind: product.kind,
                      withholdingRate: String(Number(product.withholdingRate ?? 0)),
                      withholdingCode: product.withholdingCode ?? "",
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
                      { key: "kind", label: "Kart türü", options: ["PRODUCT", "SERVICE"] },
                      { key: "category", label: "Kategori" },
                      { key: "brand", label: "Marka" },
                      { key: "withholdingRate", label: "Tevkifat oranı", type: "number" },
                      { key: "withholdingCode", label: "Tevkifat kodu" },
                      { key: "description", label: "Açıklama", type: "textarea" },
                      { key: "unit", label: "Birim", options: ["Adet", "Kg", "Litre", "Paket", "Hizmet", "Koli", "Saat", "Gün"] },
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
  );
}

export default async function StockPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { membership, tenant, user } = await getTenantContext();
  const params = (await searchParams) ?? {};
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const products = await db.product.findMany({ where: { tenantId: tenant.id }, orderBy: [{ name: "asc" }] });
  const lowStockCount = products.filter((product) => product.kind === "PRODUCT" && Number(product.stockQty) <= 15).length;
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

  const stockItems = filteredProducts.filter((product) => product.kind === "PRODUCT");
  const serviceItems = filteredProducts.filter((product) => product.kind === "SERVICE");

  return (
    <AppShell
      title="Stok & Hizmet"
      subtitle="Ürün kartları ve hizmet kartları ayrı gruplarda yönetilir. Hizmet kartlarında tevkifat alanı e-Fatura akışına hazırdır."
      currentPath="/panel/stok"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      userEmail={user.email}
      topAction={
        <div className="flex flex-wrap gap-2">
          <Link href="/panel/stok/excel" className="inline-flex h-10 items-center border border-[var(--line)] bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
            Excel İşlemleri
          </Link>
          <Link href="/panel/stok/toplu-fiyat" className="inline-flex h-10 items-center border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-700 hover:bg-amber-100">
            Toplu Fiyat
          </Link>
          <QuickActionLink href="/panel/stok/yeni" label="Yeni Kart" />
        </div>
      }
    >
      <div className="space-y-6">
        <MobileHeroPanel
          eyebrow="Stok Operasyonu"
          title="Ürünler ve hizmetler"
          text="Stok takibi yapılan ürünler ile tevkifatlı hizmet kartları ayrı gruplarda görünür. Satış faturasında seçilen hizmetler e-Fatura düzenine göre hazırlanır."
        >
          <MobileStatStrip
            items={[
              { label: "Ürün", value: String(stockItems.length) },
              { label: "Hizmet", value: String(serviceItems.length), tone: "warn" },
              { label: "Düşük Stok", value: String(lowStockCount), tone: "warn" },
              { label: "Toplam Miktar", value: formatNumber(totalStock), tone: "success" },
            ]}
          />
          <div className="mt-4">
            <MobileActionChips
              actions={[
                { href: "/panel/stok/yeni", label: "Yeni Kart" },
                { href: "/panel/stok/excel", label: "Excel" },
                { href: "/panel/stok/toplu-fiyat", label: "Toplu Fiyat" },
              ]}
            />
          </div>
        </MobileHeroPanel>

        <SectionCard eyebrow="Filtre" title="Kartları ara" action={<Link href="/panel/stok" className="text-sm font-bold text-[var(--brand)]">Temizle</Link>}>
          <div className="hidden lg:block">
            <form className="grid gap-3 border border-[var(--line)] bg-[var(--panel-soft)] p-4 lg:grid-cols-[1.4fr_auto]">
              <input name="q" defaultValue={query} placeholder="Ürün, hizmet, barkod, marka veya kategori ara" />
              <button className="border border-[var(--brand)] bg-[var(--brand)] px-4 py-3 text-sm font-bold text-white hover:bg-[var(--brand-strong)]">Filtrele</button>
            </form>
          </div>

          <MobileFilterBar>
            <form className="grid gap-2" action="/panel/stok">
              <input name="q" defaultValue={query} placeholder="Ürün veya hizmet ara" className="h-11 border border-[var(--line)] bg-white px-3 text-sm font-medium text-slate-700 outline-none" />
              <button className="inline-flex h-11 items-center justify-center border border-[var(--brand)] bg-[var(--brand)] px-4 text-sm font-bold text-white">
                Filtrele
              </button>
            </form>
          </MobileFilterBar>
        </SectionCard>

        <SectionCard eyebrow="Ürün Grubu" title={`Stok kartları (${stockItems.length})`}>
          <div className="space-y-4 lg:hidden">
            {stockItems.length === 0 ? (
              <div className="border border-dashed border-[var(--line)] bg-white px-4 py-10 text-center text-sm text-slate-500">
                Aramanıza uygun ürün bulunamadı.
              </div>
            ) : (
              stockItems.map((product) => <ProductCard key={product.id} product={product} />)
            )}
          </div>
          <ProductTable items={stockItems} />
        </SectionCard>

        <SectionCard eyebrow="Hizmet Grubu" title={`Hizmet kartları (${serviceItems.length})`}>
          <div className="mb-4 border border-sky-100 bg-sky-50 px-4 py-4 text-sm text-sky-900">
            Hizmet kartlarında tevkifat oranı ve kodu tutulur. Satış faturasında bu kart seçildiğinde e-Fatura / e-Arşiv önizlemesine tevkifat bilgisi eklenir.
          </div>
          <div className="space-y-4 lg:hidden">
            {serviceItems.length === 0 ? (
              <div className="border border-dashed border-[var(--line)] bg-white px-4 py-10 text-center text-sm text-slate-500">
                Aramanıza uygun hizmet bulunamadı.
              </div>
            ) : (
              serviceItems.map((product) => <ProductCard key={product.id} product={product} />)
            )}
          </div>
          <ProductTable items={serviceItems} />
        </SectionCard>
      </div>
    </AppShell>
  );
}

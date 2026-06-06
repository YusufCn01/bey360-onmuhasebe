/* eslint-disable @next/next/no-img-element */
"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ProductFormState = {
  code: string;
  name: string;
  kind: "PRODUCT" | "SERVICE";
  barcode: string;
  description: string;
  category: string;
  brand: string;
  imageUrl: string;
  withholdingRate: string;
  withholdingCode: string;
  unit: string;
  salePrice: string;
  salePrice2: string;
  salePrice3: string;
  salePrice4: string;
  purchasePrice: string;
  stockQty: string;
  vatRate: string;
};

type SaveIntent = "stay" | "new";
type ProductTab = "genel" | "fiyat" | "ek";

const initialForm: ProductFormState = {
  code: "",
  name: "",
  kind: "PRODUCT",
  barcode: "",
  description: "",
  category: "",
  brand: "",
  imageUrl: "",
  withholdingRate: "0",
  withholdingCode: "601",
  unit: "Adet",
  salePrice: "0",
  salePrice2: "0",
  salePrice3: "0",
  salePrice4: "0",
  purchasePrice: "0",
  stockQty: "0",
  vatRate: "20",
};

const unitOptions = ["Adet", "Kg", "Litre", "Paket", "Hizmet", "Koli", "Saat", "Gün"];
const quickCategories = ["Gıda", "İçecek", "Elektronik", "Hizmet", "Yedek Parça", "Ofis"];
const quickBrands = ["Bey360", "Logo", "Özel Marka", "Distribütör", "İthal", "Yerel"];

function formatCurrency(value: string) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[20px] border border-[var(--line)] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
      <div className="border-b border-[var(--line)] px-6 py-5">
        <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.16em] text-slate-500">{children}</span>;
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? "rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(213,32,42,0.18)]" : "rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"}
    >
      {children}
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[60%] truncate text-right font-extrabold text-slate-900">{value}</span>
    </div>
  );
}

export function ProductForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [tab, setTab] = useState<ProductTab>("genel");
  const [busy, setBusy] = useState<SaveIntent | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const grossSalePrice = useMemo(() => {
    const sale = Number(form.salePrice || 0);
    const vat = Number(form.vatRate || 0);
    const value = sale + (sale * vat) / 100;
    return formatCurrency(String(Number.isFinite(value) ? value : 0));
  }, [form.salePrice, form.vatRate]);

  const withholdingPreview = useMemo(() => {
    const sale = Number(form.salePrice || 0);
    const rate = Number(form.withholdingRate || 0);
    if (form.kind !== "SERVICE" || !Number.isFinite(rate) || rate <= 0) {
      return 0;
    }
    return sale * (rate / 100);
  }, [form.kind, form.salePrice, form.withholdingRate]);

  function patchField<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleImageChange(file: File | null) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Ürün görseli en fazla 2 MB olabilir.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      patchField("imageUrl", result);
      setError(null);
      setMessage("Ürün görseli eklendi. Kaydettiğinizde kartla birlikte saklanacak.");
    };
    reader.onerror = () => {
      setError("Görsel okunamadı. Lütfen tekrar deneyin.");
    };
    reader.readAsDataURL(file);
  }

  async function saveProduct(intent: SaveIntent) {
    setBusy(intent);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/panel/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setError(result?.error ?? "Ürün kartı oluşturulamadı.");
      setBusy(null);
      return;
    }

    setMessage(intent === "new" ? "Ürün kartı oluşturuldu. Yeni kayıt için form temizlendi." : "Ürün kartı oluşturuldu.");
    if (intent === "new") {
      setForm(initialForm);
      setTab("genel");
    }
    router.refresh();
    setBusy(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveProduct("stay");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-[24px] border border-[var(--line)] bg-[linear-gradient(135deg,#ffffff_0%,#fff6f6_100%)] px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--brand)]">Stok ve Hizmet</p>
            <h2 className="mt-2 text-[2rem] font-extrabold tracking-tight text-slate-900">Yeni Ürün Kartı</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Ürün kodu, barkod, marka, kategori, fiyat kademeleri, stok miktarı ve görsel bilgisini tek kartta sade
              bir akışla yönetin. Liste, Excel ve toplu fiyat ekranlarıyla aynı veri yapısını kullanır.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void saveProduct("new")}
              disabled={busy !== null}
              className="inline-flex h-11 items-center rounded-[14px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {busy === "new" ? "Kaydediliyor..." : "Kaydet ve Yeni Ekle"}
            </button>
            <button
              type="submit"
              disabled={busy !== null}
              className="inline-flex h-11 items-center rounded-[14px] bg-[var(--brand)] px-5 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(213,32,42,0.18)] hover:bg-[var(--brand-strong)] disabled:opacity-60"
            >
              {busy === "stay" ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <TabButton active={tab === "genel"} onClick={() => setTab("genel")}>Genel</TabButton>
            <TabButton active={tab === "fiyat"} onClick={() => setTab("fiyat")}>Fiyat ve Stok</TabButton>
            <TabButton active={tab === "ek"} onClick={() => setTab("ek")}>Marka, Kategori ve Medya</TabButton>
          </div>

          {tab === "genel" ? (
            <>
              <Section title="Ürün Kimliği" description="Kartın temel bilgileri ve satışta görünecek ana alanlar.">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Kart Türü</Label>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          patchField("kind", "PRODUCT");
                          patchField("unit", form.unit === "Hizmet" ? "Adet" : form.unit);
                          patchField("withholdingRate", "0");
                        }}
                        className={form.kind === "PRODUCT" ? "rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-extrabold text-white" : "rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold text-slate-600"}
                      >
                        Ürün
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          patchField("kind", "SERVICE");
                          patchField("unit", "Hizmet");
                          patchField("stockQty", "0");
                        }}
                        className={form.kind === "SERVICE" ? "rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-extrabold text-white" : "rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold text-slate-600"}
                      >
                        Hizmet
                      </button>
                    </div>
                  </div>
                  <label className="space-y-2">
                    <Label>Ürün Kodu</Label>
                    <input value={form.code} onChange={(event) => patchField("code", event.target.value)} placeholder="URN-0001" required />
                  </label>
                  <label className="space-y-2">
                    <Label>Barkod</Label>
                    <input value={form.barcode} onChange={(event) => patchField("barcode", event.target.value)} placeholder="8680000000000" />
                  </label>
                  <label className="space-y-2">
                      <Label>{form.kind === "SERVICE" ? "Hizmet Birimi" : "Birim"}</Label>
                      <select value={form.unit} onChange={(event) => patchField("unit", event.target.value)}>
                      {unitOptions.map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2 md:col-span-2">
                      <Label>{form.kind === "SERVICE" ? "Hizmet Adı" : "Ürün Adı"}</Label>
                      <input value={form.name} onChange={(event) => patchField("name", event.target.value)} placeholder={form.kind === "SERVICE" ? "Örn: Danışmanlık Hizmeti" : "Örn: Espresso Çekirdeği 1 kg"} required />
                  </label>
                </div>
              </Section>

              <Section title="Vergi Bilgisi" description={form.kind === "SERVICE" ? "KDV ve tevkifat alanları e-Fatura düzenine uyumlu tutulur." : "KDV oranını sabitleyin veya hızlı seçimle belirleyin."}>
                <div className={`grid gap-4 ${form.kind === "SERVICE" ? "md:grid-cols-3" : "md:grid-cols-[220px_1fr] md:items-end"}`}>
                  <label className="space-y-2">
                    <Label>KDV Oranı</Label>
                    <input type="number" step="0.01" min="0" max="100" value={form.vatRate} onChange={(event) => patchField("vatRate", event.target.value)} />
                  </label>
                  <div className="space-y-2">
                    <Label>Hızlı KDV Seçimi</Label>
                    <div className="flex flex-wrap gap-2">
                      {[0, 1, 8, 10, 20].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => patchField("vatRate", String(rate))}
                          className={form.vatRate === String(rate) ? "rounded-full bg-[var(--brand)] px-3 py-2 text-xs font-extrabold text-white" : "rounded-full border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 text-xs font-bold text-slate-600 hover:bg-white"}
                        >
                          %{rate}
                        </button>
                      ))}
                      </div>
                    </div>
                  {form.kind === "SERVICE" ? (
                    <>
                      <label className="space-y-2">
                        <Label>Tevkifat Oranı</Label>
                        <input type="number" step="0.01" min="0" max="100" value={form.withholdingRate} onChange={(event) => patchField("withholdingRate", event.target.value)} />
                      </label>
                      <label className="space-y-2">
                        <Label>Tevkifat Kodu</Label>
                        <input value={form.withholdingCode} onChange={(event) => patchField("withholdingCode", event.target.value)} placeholder="601" />
                      </label>
                    </>
                  ) : null}
                </div>
                {form.kind === "SERVICE" ? (
                  <div className="mt-4 rounded-[14px] border border-sky-100 bg-sky-50 px-4 py-4 text-sm text-sky-900">
                    Bu hizmet kartı satışta seçildiğinde tevkifat oranı faturaya taşınır ve e-Fatura / e-Arşiv UBL çıktısında tevkifat alanı oluşturulur.
                  </div>
                ) : null}
              </Section>
            </>
          ) : null}

          {tab === "fiyat" ? (
            <>
              <Section title="Fiyatlandırma" description="Alış ve satış tutarlarını ayrı alanlarda yönetin.">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <label className="space-y-2">
                    <Label>Satış Fiyatı 1</Label>
                    <input type="number" step="0.01" min="0" value={form.salePrice} onChange={(event) => patchField("salePrice", event.target.value)} />
                  </label>
                  <label className="space-y-2">
                    <Label>Alış Fiyatı</Label>
                    <input type="number" step="0.01" min="0" value={form.purchasePrice} onChange={(event) => patchField("purchasePrice", event.target.value)} />
                  </label>
                  <label className="space-y-2">
                    <Label>Stok Miktarı</Label>
                    <input type="number" step="0.001" value={form.stockQty} onChange={(event) => patchField("stockQty", event.target.value)} disabled={form.kind === "SERVICE"} />
                  </label>
                </div>
              </Section>

              <Section title="Alternatif Satış Fiyatları" description="Toptan, bayi veya kampanya gibi ek fiyat kademelerini burada tutun.">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <label className="space-y-2">
                    <Label>Satış Fiyatı 2</Label>
                    <input type="number" step="0.01" min="0" value={form.salePrice2} onChange={(event) => patchField("salePrice2", event.target.value)} />
                  </label>
                  <label className="space-y-2">
                    <Label>Satış Fiyatı 3</Label>
                    <input type="number" step="0.01" min="0" value={form.salePrice3} onChange={(event) => patchField("salePrice3", event.target.value)} />
                  </label>
                  <label className="space-y-2">
                    <Label>Satış Fiyatı 4</Label>
                    <input type="number" step="0.01" min="0" value={form.salePrice4} onChange={(event) => patchField("salePrice4", event.target.value)} />
                  </label>
                </div>
              </Section>

              <Section title="Hızlı Kontrol" description="Temel rakamları kaydetmeden önce hızlıca gözden geçirin.">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Satış 1</p>
                    <p className="mt-2 text-lg font-extrabold text-slate-900">{formatCurrency(form.salePrice)}</p>
                  </div>
                  <div className="rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">KDV Dahil</p>
                    <p className="mt-2 text-lg font-extrabold text-slate-900">{grossSalePrice}</p>
                  </div>
                  <div className="rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Stok</p>
                    <p className="mt-2 text-lg font-extrabold text-slate-900">{Number(form.stockQty || 0).toLocaleString("tr-TR")}</p>
                  </div>
                </div>
              </Section>
            </>
          ) : null}

          {tab === "ek" ? (
            <>
              <Section title="Marka ve Kategori" description="Liste ve raporlarda kullanılacak sınıflandırmaları girin.">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <label className="space-y-2">
                      <Label>Kategori</Label>
                      <input value={form.category} onChange={(event) => patchField("category", event.target.value)} placeholder="Örn: İçecek" />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {quickCategories.map((item) => (
                        <button key={item} type="button" onClick={() => patchField("category", item)} className="rounded-full border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 text-xs font-bold text-slate-600 hover:bg-white">
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="space-y-2">
                      <Label>Marka</Label>
                      <input value={form.brand} onChange={(event) => patchField("brand", event.target.value)} placeholder="Örn: Bey360" />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {quickBrands.map((item) => (
                        <button key={item} type="button" onClick={() => patchField("brand", item)} className="rounded-full border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 text-xs font-bold text-slate-600 hover:bg-white">
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Açıklama ve Görsel" description="Kartın iç açıklamasını ve ürün görselini burada tutun.">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
                  <div className="space-y-4">
                    <label className="space-y-2">
                      <Label>Ürün Açıklaması</Label>
                      <textarea
                        rows={7}
                        value={form.description}
                        onChange={(event) => patchField("description", event.target.value)}
                        placeholder="Ürünle ilgili kısa açıklama, teknik bilgi veya satış notu yazın."
                      />
                    </label>
                    <label className="space-y-2">
                      <Label>Görsel Yükle</Label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) => void handleImageChange(event.target.files?.[0] ?? null)}
                      />
                    </label>
                    {form.imageUrl ? (
                      <button type="button" onClick={() => patchField("imageUrl", "")} className="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100">
                        Görseli Kaldır
                      </button>
                    ) : null}
                  </div>

                  <div className="rounded-[18px] border border-dashed border-[var(--line)] bg-[var(--panel-soft)] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Canlı Önizleme</p>
                    <div className="mt-4 overflow-hidden rounded-[16px] border border-[var(--line)] bg-white">
                      {form.imageUrl ? (
                        <img src={form.imageUrl} alt={form.name || "Ürün görseli"} className="h-48 w-full object-cover" />
                      ) : (
                        <div className="flex h-48 items-center justify-center bg-[linear-gradient(135deg,#f8fafc_0%,#fee2e2_100%)] text-sm font-bold text-slate-400">
                          Görsel eklenmedi
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Section>
            </>
          ) : null}

          <div className="space-y-1">
            {error ? <p className="rounded-[14px] border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}
            {message ? <p className="rounded-[14px] border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p> : null}
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Section title="Kart Özeti" description="Girdiğiniz değerlerin canlı özeti.">
            <div className="space-y-3">
              <SummaryRow label="Kart Durumu" value="Aktif" />
              <SummaryRow label="Kart Türü" value={form.kind === "SERVICE" ? "Hizmet" : "Ürün"} />
              <SummaryRow label="Barkod" value={form.barcode || "-"} />
              <SummaryRow label="Kategori" value={form.category || "-"} />
              <SummaryRow label="Marka" value={form.brand || "-"} />
              <SummaryRow label="Birim" value={form.unit || "-"} />
              <SummaryRow label="Satış Fiyatı 1" value={formatCurrency(form.salePrice)} />
              <SummaryRow label="Satış Fiyatı 2" value={formatCurrency(form.salePrice2)} />
              <SummaryRow label="Alış Fiyatı" value={formatCurrency(form.purchasePrice)} />
              <SummaryRow label="KDV Dahil Satış" value={grossSalePrice} />
              {form.kind === "SERVICE" ? (
                <>
                  <SummaryRow label="Tevkifat" value={`%${Number(form.withholdingRate || 0).toLocaleString("tr-TR")}`} />
                  <SummaryRow label="Tevkifat Tutarı" value={formatCurrency(String(withholdingPreview))} />
                </>
              ) : (
                <SummaryRow label="Stok Miktarı" value={`${Number(form.stockQty || 0).toLocaleString("tr-TR")} ${form.unit}`} />
              )}
            </div>
          </Section>

          <Section title="Hızlı Geçiş" description="Sık kullanılan işlemler.">
            <div className="space-y-3">
              <button type="button" onClick={() => setTab("genel")} className="w-full rounded-[12px] border border-[var(--line)] bg-white px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50">Genel Bilgilere Dön</button>
              <button type="button" onClick={() => setTab("fiyat")} className="w-full rounded-[12px] border border-[var(--line)] bg-white px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50">Fiyat ve Stok Bölümü</button>
              <button type="button" onClick={() => setTab("ek")} className="w-full rounded-[12px] border border-[var(--line)] bg-white px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50">Marka ve Medya Bölümü</button>
              <button type="button" onClick={() => router.push("/panel/stok")} className="w-full rounded-[12px] border border-[var(--line)] bg-white px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50">Stok Listesine Git</button>
            </div>
          </Section>
        </aside>
      </div>
    </form>
  );
}



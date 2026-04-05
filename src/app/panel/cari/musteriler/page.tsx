import Link from "next/link";
import { CustomerEInvoiceCheckButton } from "@/components/actions/customer-einvoice-check-button";
import { EntityDialogActions } from "@/components/actions/entity-dialog-actions";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard, StatusPill, SummaryCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import { tenantNavGroups } from "@/lib/navigation";

function initials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default async function CustomersListPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { membership, tenant, user } = await getTenantContext();
  const params = (await searchParams) ?? {};
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const customers = await db.customer.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } });

  const filteredCustomers = customers.filter((customer) => {
    return !query || [customer.name, customer.code, customer.phone ?? "", customer.email ?? "", customer.taxNumber ?? "", customer.city ?? ""].some((value) => value.toLowerCase().includes(query));
  });

  const debtCustomers = filteredCustomers.filter((customer) => Number(customer.currentDebt) > 0).length;
  const totalDebt = filteredCustomers.reduce((sum, customer) => sum + Number(customer.currentDebt), 0);
  const totalCredit = filteredCustomers.reduce((sum, customer) => sum + Number(customer.currentCredit), 0);
  const checkedCustomers = filteredCustomers.filter((customer) => customer.eInvoiceCheckedAt).length;

  return (
    <AppShell
      title="Müşteriler"
      subtitle="Müşteri kartlarını sade bir listede yönetin. Excel işlemleri ve yeni kayıt üst aksiyonlardan açılır."
      currentPath="/panel/cari/musteriler"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/panel/cari/musteriler/excel" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">
            Excel İşlemleri
          </Link>
          <Link href="/panel/cari/musteri/yeni" className="inline-flex h-10 items-center rounded-[10px] bg-[var(--brand)] px-4 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(213,32,42,0.18)] hover:bg-[var(--brand-strong)]">
            Yeni Müşteri
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-4">
          <SummaryCard title="Toplam Müşteri" value={String(filteredCustomers.length)} detail="Arama sonucu görünen kayıt adedi." accent="border-blue-200" />
          <SummaryCard title="Borç Bakiyesi" value={formatCurrency(totalDebt)} detail={`${debtCustomers} müşteri borç bakiyesi taşıyor.`} accent="border-rose-200" />
          <SummaryCard title="Alacak Bakiyesi" value={formatCurrency(totalCredit)} detail="Toplam tahsilat öncesi alacak bakiyesi." accent="border-emerald-200" />
          <SummaryCard title="e-Belge Kontrolü" value={String(checkedCustomers)} detail="Alias ve uygunluk kontrolü yapılmış müşteri sayısı." accent="border-amber-200" />
        </div>

        <SectionCard
          eyebrow="Müşteri Portföyü"
          title="Cari müşteri listesi"
          action={<Link href="/panel/cari/musteriler" className="text-sm font-bold text-[var(--brand)]">Filtreyi temizle</Link>}
        >
          <div className="space-y-5">
            <form className="grid gap-3 rounded-[18px] border border-[var(--line)] bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Hızlı Arama</p>
                <input name="q" defaultValue={query} placeholder="Ünvan, cari kodu, vergi no, telefon veya şehir ara" />
              </div>
              <div className="flex items-end gap-3">
                <button className="inline-flex h-11 items-center rounded-[12px] bg-[var(--brand)] px-5 text-sm font-extrabold text-white hover:bg-[var(--brand-strong)]">
                  Filtrele
                </button>
              </div>
            </form>

            <div className="space-y-4 lg:hidden">
              {filteredCustomers.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-[var(--line)] bg-white px-4 py-10 text-center text-sm text-slate-500">
                  Aramanıza uygun müşteri kaydı bulunamadı.
                </div>
              ) : (
                filteredCustomers.map((customer) => {
                  const debt = Number(customer.currentDebt);
                  const credit = Number(customer.currentCredit);
                  const hasDebt = debt > 0;
                  const einvoiceCheckedAt = customer.eInvoiceCheckedAt ? formatDate(customer.eInvoiceCheckedAt) : null;

                  return (
                    <article key={customer.id} className="rounded-[20px] border border-[var(--line)] bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#fee2e2_0%,#ffffff_100%)] text-sm font-black text-[var(--brand)] shadow-[inset_0_0_0_1px_rgba(220,38,38,0.08)]">
                          {initials(customer.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-[15px] font-extrabold text-slate-900">{customer.name}</p>
                            <StatusPill label={hasDebt ? "Borçlu" : credit > 0 ? "Alacaklı" : "Dengede"} tone={hasDebt ? "rose" : credit > 0 ? "emerald" : "slate"} />
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span>{customer.code}</span>
                            <span>{customer.taxNumber ?? "Vergi no yok"}</span>
                            <span>{customer.city ?? "Şehir yok"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-[14px] border border-rose-100 bg-rose-50/70 px-3 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-rose-400">Borç</p>
                          <p className="mt-1 text-sm font-extrabold text-rose-700">{formatCurrency(debt)}</p>
                        </div>
                        <div className="rounded-[14px] border border-emerald-100 bg-emerald-50/70 px-3 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-400">Alacak</p>
                          <p className="mt-1 text-sm font-extrabold text-emerald-700">{formatCurrency(credit)}</p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 text-sm">
                        <p className="font-semibold text-slate-700">{customer.phone ?? "Telefon yok"}</p>
                        <p className="truncate text-slate-500">{customer.email ?? "E-posta yok"}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          {typeof customer.eInvoiceRegistered === "boolean" ? (
                            <StatusPill label={customer.eInvoiceRegistered ? "e-Fatura Uygun" : "e-Arşiv / Kontrol"} tone={customer.eInvoiceRegistered ? "emerald" : "amber"} />
                          ) : (
                            <StatusPill label="Henüz sorgulanmadı" tone="slate" />
                          )}
                          {customer.eInvoiceAlias ? <span className="truncate text-xs font-semibold text-slate-500">{customer.eInvoiceAlias}</span> : null}
                        </div>
                        {customer.eInvoiceCheckNote ? <p className="text-xs text-slate-500">{customer.eInvoiceCheckNote}</p> : null}
                        {einvoiceCheckedAt ? <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Son kontrol: {einvoiceCheckedAt}</p> : null}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link href="/panel/satis-faturalari/yeni" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-100">
                          Satış Faturası
                        </Link>
                        <CustomerEInvoiceCheckButton customerId={customer.id} />
                        <EntityDialogActions
                          title={customer.name}
                          endpoint={`/api/panel/customers/${customer.id}`}
                          deleteLabel="Müşteri kartı"
                          initialData={{
                            code: customer.code,
                            name: customer.name,
                            taxNumber: customer.taxNumber ?? "",
                            phone: customer.phone ?? "",
                            email: customer.email ?? "",
                            city: customer.city ?? "",
                            currentDebt: String(debt),
                            currentCredit: String(credit),
                          }}
                          fields={[
                            { key: "code", label: "Cari kodu" },
                            { key: "name", label: "Müşteri / Ünvan" },
                            { key: "taxNumber", label: "Vergi / TC no" },
                            { key: "phone", label: "Telefon" },
                            { key: "email", label: "E-posta", type: "email" },
                            { key: "city", label: "Şehir" },
                            { key: "currentDebt", label: "Açılış borcu", type: "number" },
                            { key: "currentCredit", label: "Açılış alacağı", type: "number" },
                          ]}
                        />
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            <div className="hidden overflow-hidden rounded-[18px] border border-[var(--line)] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.05)] lg:block">
              <div className="hidden grid-cols-[minmax(260px,1.2fr)_minmax(240px,0.95fr)_minmax(180px,0.8fr)_auto] gap-4 border-b border-[var(--line)] bg-slate-50/80 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 lg:grid">
                <span>Müşteri</span>
                <span>İletişim ve e-Belge</span>
                <span>Bakiye</span>
                <span className="text-right">Aksiyon</span>
              </div>

              <div className="divide-y divide-[var(--line)]">
                {filteredCustomers.length === 0 ? (
                  <div className="px-5 py-10 text-center text-sm text-slate-500">Aramanıza uygun müşteri kaydı bulunamadı.</div>
                ) : (
                  filteredCustomers.map((customer) => {
                    const debt = Number(customer.currentDebt);
                    const credit = Number(customer.currentCredit);
                    const hasDebt = debt > 0;
                    const einvoiceCheckedAt = customer.eInvoiceCheckedAt ? formatDate(customer.eInvoiceCheckedAt) : null;

                    return (
                      <div key={customer.id} className="px-5 py-4 transition hover:bg-slate-50/70">
                        <div className="grid gap-4 lg:grid-cols-[minmax(260px,1.2fr)_minmax(240px,0.95fr)_minmax(180px,0.8fr)_auto] lg:items-center">
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#fee2e2_0%,#ffffff_100%)] text-sm font-black text-[var(--brand)] shadow-[inset_0_0_0_1px_rgba(220,38,38,0.08)]">
                              {initials(customer.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-[15px] font-extrabold text-slate-900">{customer.name}</p>
                                <StatusPill label={hasDebt ? "Borçlu" : credit > 0 ? "Alacaklı" : "Dengede"} tone={hasDebt ? "rose" : credit > 0 ? "emerald" : "slate"} />
                              </div>
                              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500">
                                <span>{customer.code}</span>
                                <span>{customer.taxNumber ?? "Vergi no yok"}</span>
                                <span>{customer.city ?? "Şehir yok"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <p className="font-semibold text-slate-700">{customer.phone ?? "Telefon yok"}</p>
                            <p className="truncate text-slate-500">{customer.email ?? "E-posta yok"}</p>
                            <div className="flex flex-wrap items-center gap-2">
                              {typeof customer.eInvoiceRegistered === "boolean" ? (
                                <StatusPill label={customer.eInvoiceRegistered ? "e-Fatura Uygun" : "e-Arşiv / Kontrol"} tone={customer.eInvoiceRegistered ? "emerald" : "amber"} />
                              ) : (
                                <StatusPill label="Henüz sorgulanmadı" tone="slate" />
                              )}
                              {customer.eInvoiceAlias ? <span className="truncate text-xs font-semibold text-slate-500">{customer.eInvoiceAlias}</span> : null}
                            </div>
                            {customer.eInvoiceCheckNote ? <p className="text-xs text-slate-500">{customer.eInvoiceCheckNote}</p> : null}
                            {einvoiceCheckedAt ? <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Son kontrol: {einvoiceCheckedAt}</p> : null}
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                            <div className="rounded-[12px] border border-rose-100 bg-rose-50/70 px-3 py-2.5">
                              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose-400">Borç</p>
                              <p className="mt-1 text-sm font-extrabold text-rose-700">{formatCurrency(debt)}</p>
                            </div>
                            <div className="rounded-[12px] border border-emerald-100 bg-emerald-50/70 px-3 py-2.5">
                              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-400">Alacak</p>
                              <p className="mt-1 text-sm font-extrabold text-emerald-700">{formatCurrency(credit)}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-2 lg:flex-nowrap">
                            <Link href="/panel/satis-faturalari/yeni" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-100">
                              Satış Faturası
                            </Link>
                            <CustomerEInvoiceCheckButton customerId={customer.id} />
                            <EntityDialogActions
                              title={customer.name}
                              endpoint={`/api/panel/customers/${customer.id}`}
                              deleteLabel="Müşteri kartı"
                              initialData={{
                                code: customer.code,
                                name: customer.name,
                                taxNumber: customer.taxNumber ?? "",
                                phone: customer.phone ?? "",
                                email: customer.email ?? "",
                                city: customer.city ?? "",
                                currentDebt: String(debt),
                                currentCredit: String(credit),
                              }}
                              fields={[
                                { key: "code", label: "Cari kodu" },
                                { key: "name", label: "Müşteri / Ünvan" },
                                { key: "taxNumber", label: "Vergi / TC no" },
                                { key: "phone", label: "Telefon" },
                                { key: "email", label: "E-posta", type: "email" },
                                { key: "city", label: "Şehir" },
                                { key: "currentDebt", label: "Açılış borcu", type: "number" },
                                { key: "currentCredit", label: "Açılış alacağı", type: "number" },
                              ]}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

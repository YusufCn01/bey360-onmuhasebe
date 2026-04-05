import Link from "next/link";
import { CustomerExcelActions } from "@/components/forms/customer-excel-actions";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard, StatusPill, SummaryCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { tenantNavGroups } from "@/lib/navigation";

export default async function CustomerExcelPage() {
  const { membership, tenant, user } = await getTenantContext();

  return (
    <AppShell
      title="Müşteri Excel İşlemleri"
      subtitle="Toplu müşteri aktarımı ve dışa aktarım işlemlerini ayrı ekrandan, format seçerek yönetin."
      currentPath="/panel/cari/musteriler/excel"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} - ${tenant.planName}`}
      topAction={
        <Link href="/panel/cari/musteriler" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">
          Müşteri Listesi
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-3">
          <SummaryCard title="Hazır Format" value="2" detail="Logo ve Hızlı Bilişim formatı seçilebilir." accent="border-blue-200" />
          <SummaryCard title="İçe Aktarım" value="Excel" detail="Başlığa göre eşleştirme yapılır, eksik müşteri kodu otomatik üretilir." accent="border-emerald-200" />
          <SummaryCard title="Dışa Aktarım" value="Anlık" detail="Seçtiğiniz formatta mevcut müşteri listesini dışa alabilirsiniz." accent="border-amber-200" />
        </div>

        <SectionCard
          eyebrow="Toplu İşlem"
          title="Excel aktarım merkezi"
          action={<StatusPill label="Ayrı ekran" tone="blue" />}
        >
          <CustomerExcelActions />
        </SectionCard>
      </div>
    </AppShell>
  );
}

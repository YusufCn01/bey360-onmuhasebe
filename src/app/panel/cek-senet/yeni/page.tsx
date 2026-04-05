import Link from "next/link";
import { ChequeNoteForm } from "@/components/forms/cheque-note-form";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { tenantNavGroups } from "@/lib/navigation";

export default async function NewChequeNotePage() {
  const { membership, tenant, user } = await getTenantContext();
  const [customers, suppliers] = await Promise.all([
    db.customer.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
    db.supplier.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
  ]);

  return (
    <AppShell
      title="Yeni Çek / Senet"
      subtitle="Portföye yeni çek veya senet kartı ekleyin."
      currentPath="/panel/cek-senet"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} · ${tenant.planName}`}
      topAction={<Link href="/panel/cek-senet" className="inline-flex h-10 items-center rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50">Çek / Senet Listesi</Link>}
    >
      <SectionCard eyebrow="Kayıt Ekranı" title="Yeni çek / senet">
        <ChequeNoteForm
          customers={customers.map((item) => ({ id: item.id, code: item.code, name: item.name }))}
          suppliers={suppliers.map((item) => ({ id: item.id, code: item.code, name: item.name }))}
          redirectPath="/panel/cek-senet"
        />
      </SectionCard>
    </AppShell>
  );
}

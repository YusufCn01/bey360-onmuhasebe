import { redirect } from "next/navigation";
import { OnboardingWizardForm } from "@/components/forms/onboarding-wizard-form";
import { AppShell } from "@/components/ui/app-shell";
import { SectionCard, SummaryCard } from "@/components/ui/module-blocks";
import { getTenantContextAllowIncomplete } from "@/lib/access";
import { tenantNavGroups } from "@/lib/navigation";

type DraftPayload = Partial<{
  name: string;
  taxNumber: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  address: string;
  logoUrl: string;
  secondaryLogoUrl: string;
  signatureImageUrl: string;
  stampImageUrl: string;
  signatureName: string;
  signatureTitle: string;
  createCustomer: boolean;
  createProduct: boolean;
  customerName: string;
  customerEmail: string;
  productName: string;
  productPrice: string;
  currentStep: number;
}>;

export default async function OnboardingPage() {
  const { membership, tenant, user } = await getTenantContextAllowIncomplete();
  const draft = parseDraft(tenant.onboardingDraftJson);

  if (tenant.onboardingCompletedAt && user.emailVerifiedAt) {
    redirect("/panel");
  }

  return (
    <AppShell
      title="Kurulum"
      subtitle="Firmanı birkaç temel adımda hazırla. İstersen yarıda bırakıp daha sonra kaldığın yerden devam edebilirsin."
      currentPath="/panel/onboarding"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} · ${tenant.planName}`}
    >
      <div className="space-y-6">
        <section className="grid gap-5 md:grid-cols-3">
          <SummaryCard
            title="E-posta doğrulama"
            value={user.emailVerifiedAt ? "Tamamlandı" : "Bekliyor"}
            detail={user.email}
            accent={`border-l-4 ${user.emailVerifiedAt ? "border-l-emerald-500" : "border-l-amber-500"} border-[var(--line)]`}
          />
          <SummaryCard
            title="Firma"
            value={draft?.name ?? tenant.name}
            detail={tenant.planName}
            accent="border-l-4 border-l-sky-500 border-[var(--line)]"
          />
          <SummaryCard
            title="Kurulum durumu"
            value={tenant.onboardingCompletedAt ? "Hazır" : "Devam ediyor"}
            detail={draft ? `Taslak adımı: ${Math.min((draft.currentStep ?? 0) + 1, 4)}` : "Temel yapılandırma"}
            accent={`border-l-4 ${tenant.onboardingCompletedAt ? "border-l-emerald-500" : "border-l-slate-400"} border-[var(--line)]`}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.84fr_1.16fr]">
          <SectionCard eyebrow="Başlangıç Adımları" title="Bu akışta neleri tamamlıyoruz?">
            <div className="space-y-4 text-sm leading-7 text-slate-600">
              <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-4">
                <p className="font-extrabold text-slate-900">1. Firma kartını netleştir</p>
                <p className="mt-2">Vergi numarası, iletişim ve adres bilgileri tamamlandığında belge akışların daha sorunsuz ilerler.</p>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-4">
                <p className="font-extrabold text-slate-900">2. Kurumsal görünümü hazırla</p>
                <p className="mt-2">Logo, imza ve kaşe görsellerini eklersen belge çıktıları doğrudan kurumsal kimliğinle hazırlanır.</p>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-4">
                <p className="font-extrabold text-slate-900">3. İlk kayıtlarını oluştur</p>
                <p className="mt-2">İstersen ilk müşteri ve ilk ürün kartını hemen açıp panele dolu bir başlangıç yapabilirsin.</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard eyebrow="Kurulum Formu" title="Firma başlangıç ayarları">
            <OnboardingWizardForm
              initial={{
                name: draft?.name ?? tenant.name,
                taxNumber: draft?.taxNumber ?? tenant.taxNumber ?? "",
                phone: draft?.phone ?? tenant.phone ?? "",
                email: draft?.email ?? tenant.email ?? user.email,
                city: draft?.city ?? tenant.city ?? "",
                district: draft?.district ?? tenant.district ?? "",
                address: draft?.address ?? tenant.address ?? "",
                logoUrl: draft?.logoUrl ?? tenant.logoUrl ?? "",
                secondaryLogoUrl: draft?.secondaryLogoUrl ?? tenant.secondaryLogoUrl ?? "",
                signatureImageUrl: draft?.signatureImageUrl ?? tenant.signatureImageUrl ?? "",
                stampImageUrl: draft?.stampImageUrl ?? tenant.stampImageUrl ?? "",
                signatureName: draft?.signatureName ?? tenant.signatureName ?? "",
                signatureTitle: draft?.signatureTitle ?? tenant.signatureTitle ?? "",
                createCustomer: draft?.createCustomer ?? false,
                createProduct: draft?.createProduct ?? false,
                customerName: draft?.customerName ?? "",
                customerEmail: draft?.customerEmail ?? "",
                productName: draft?.productName ?? "",
                productPrice: draft?.productPrice ?? "",
                currentStep: draft?.currentStep ?? tenant.onboardingCurrentStep ?? 0,
              }}
            />
          </SectionCard>
        </section>
      </div>
    </AppShell>
  );
}

function parseDraft(value: string | null): DraftPayload | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as DraftPayload;
  } catch {
    return null;
  }
}

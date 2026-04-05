import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCustomerCreditCount, getDashboardInfo, loginToHizliBilisim, testHizliBilisimConnection } from "@/lib/integrations/hizli-bilisim";
import { getTenantRouteContext } from "@/lib/session-context";

export async function POST() {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const settings = await db.eInvoiceSettings.findUnique({ where: { tenantId: context.tenant.id } });
  if (!settings) {
    return NextResponse.json({ success: false, error: "Önce Hızlı Bilişim ayarlarını kaydetmelisiniz." }, { status: 422 });
  }

  try {
    const result = await testHizliBilisimConnection(settings);
    if (result.success && (result.gb || result.vkn || result.customerName)) {
      const login = await loginToHizliBilisim(settings);
      let creditCount = settings.serviceCreditCount;
      if (login.success && result.vkn) {
        const [creditInfo, dashboard] = await Promise.all([
          getCustomerCreditCount(settings, result.vkn, login),
          getDashboardInfo(settings, result.vkn, login),
        ]);
        const nextCredit = creditInfo.remainCredit ?? dashboard.creditRemainder ?? null;
        creditCount = typeof nextCredit === "number" && Number.isFinite(nextCredit) ? Math.max(0, Math.floor(nextCredit)) : settings.serviceCreditCount;
      }

      await db.eInvoiceSettings.update({
        where: { tenantId: context.tenant.id },
        data: {
          gibAlias: result.gb ?? settings.gibAlias,
          senderTaxNumber: result.vkn ?? settings.senderTaxNumber,
          senderTitle: result.customerName ?? settings.senderTitle,
          serviceCreditCount: creditCount,
          serviceCreditUpdatedAt: new Date(),
        },
      });
      revalidatePath("/panel/ayarlar/hizli-bilisim");
      revalidatePath("/panel/ayarlar/e-fatura");
      revalidatePath("/panel");
    }
    return result.success
      ? NextResponse.json({ success: true, data: result })
      : NextResponse.json({ success: false, error: result.note }, { status: 502 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bağlantı testi başarısız oldu.";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCustomerCreditCount, getDashboardInfo, loginToHizliBilisim } from "@/lib/integrations/hizli-bilisim";
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

  const identifier = settings.senderTaxNumber?.trim();
  if (!identifier) {
    return NextResponse.json({ success: false, error: "Önce bağlantı testini yaparak gönderici VKN bilgisini doldurmalısınız." }, { status: 422 });
  }

  try {
    const login = await loginToHizliBilisim(settings);
    if (!login.success) {
      return NextResponse.json({ success: false, error: login.note }, { status: 502 });
    }

    const [creditInfo, dashboard] = await Promise.all([
      getCustomerCreditCount(settings, identifier, login),
      getDashboardInfo(settings, identifier, login),
    ]);

    const nextCreditCount = creditInfo.remainCredit ?? dashboard.creditRemainder ?? settings.serviceCreditCount ?? null;

    const updatedSettings = await db.eInvoiceSettings.update({
      where: { tenantId: context.tenant.id },
      data: {
        serviceCreditCount: typeof nextCreditCount === "number" && Number.isFinite(nextCreditCount) ? Math.max(0, Math.floor(nextCreditCount)) : null,
        serviceCreditUpdatedAt: new Date(),
      },
    });

    revalidatePath("/panel/ayarlar/hizli-bilisim");
    revalidatePath("/panel");

    return NextResponse.json({
      success: true,
      data: {
        creditCount: updatedSettings.serviceCreditCount,
        updatedAt: updatedSettings.serviceCreditUpdatedAt,
        totalCredit: creditInfo.totalCredit ?? dashboard.creditTotal ?? null,
        remainCredit: creditInfo.remainCredit ?? dashboard.creditRemainder ?? null,
        inboxCount: dashboard.inboxCount ?? null,
        outboxCount: dashboard.outboxCount ?? null,
        archiveCount: dashboard.archiveCount ?? null,
        despatchInboxCount: dashboard.despatchInboxCount ?? null,
        despatchOutboxCount: dashboard.despatchOutboxCount ?? null,
        note: [creditInfo.note, dashboard.note].filter(Boolean).join(" · "),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kontör bilgisi alınamadı.";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}

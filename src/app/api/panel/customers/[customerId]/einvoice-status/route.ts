import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getGibUserList } from "@/lib/integrations/hizli-bilisim";
import { getTenantRouteContext } from "@/lib/session-context";

export async function POST(_: Request, { params }: { params: Promise<{ customerId: string }> }) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const { customerId } = await params;
  const [customer, settings] = await Promise.all([
    db.customer.findFirst({
      where: { id: customerId, tenantId: context.tenant.id },
    }),
    db.eInvoiceSettings.findUnique({
      where: { tenantId: context.tenant.id },
    }),
  ]);

  if (!customer) {
    return NextResponse.json({ success: false, error: "Müşteri kartı bulunamadı." }, { status: 404 });
  }

  if (!settings || settings.provider !== "HIZLI_BILISIM") {
    return NextResponse.json({ success: false, error: "Önce Hızlı Bilişim sağlayıcısını aktif etmelisiniz." }, { status: 422 });
  }

  const taxNumber = customer.taxNumber?.trim();
  if (!taxNumber) {
    return NextResponse.json({ success: false, error: "Bu müşteri için vergi no / T.C. kimlik no bulunmuyor." }, { status: 422 });
  }

  const lookup = await getGibUserList(settings, taxNumber, "PK", 1);
  const matchedUser = lookup.users[0];
  const notRegisteredMessage = lookup.note.toLocaleLowerCase("tr-TR");
  const isNotTaxpayer = notRegisteredMessage.includes("mükellefi değil") || notRegisteredMessage.includes("mukellefi degil");

  if (!lookup.success && !isNotTaxpayer) {
    return NextResponse.json({ success: false, error: lookup.note || "e-Fatura uygunluk sorgusu başarısız oldu." }, { status: 502 });
  }

  const registered = lookup.success && Boolean(matchedUser?.Alias);

  const note = registered
    ? `e-Fatura mükellefi · PK alias: ${matchedUser.Alias}`
    : lookup.note || "Bu müşteri için e-Fatura kaydı bulunamadı. e-Arşiv olarak işlem yapılabilir.";

  const updated = await db.customer.update({
    where: { id: customer.id },
    data: {
      eInvoiceRegistered: registered,
      eInvoiceAlias: matchedUser?.Alias ?? null,
      eInvoiceCheckNote: note,
      eInvoiceCheckedAt: new Date(),
    },
  });

  revalidatePath("/panel/cari");
  revalidatePath("/panel/cari/musteriler");
  revalidatePath(`/panel/cari/musteriler/${customer.id}`);

  return NextResponse.json({
    success: true,
    data: {
      customerId: updated.id,
      registered,
      alias: updated.eInvoiceAlias,
      checkedAt: updated.eInvoiceCheckedAt,
      note,
    },
  });
}

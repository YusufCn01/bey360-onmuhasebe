import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getGibUserList, loginToHizliBilisim } from "@/lib/integrations/hizli-bilisim";
import { getTenantRouteContext } from "@/lib/session-context";

function onlyDigits(value: string | null | undefined) {
  return String(value ?? "").replace(/\D/g, "");
}

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const settings = await db.eInvoiceSettings.findUnique({ where: { tenantId: context.tenant.id } });
  if (!settings) {
    return NextResponse.json({ success: false, error: "Önce Hızlı Bilişim ayarlarını kaydetmelisiniz." }, { status: 422 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        identifier?: string;
        type?: "GB" | "PK";
        appType?: number;
      }
    | null;

  const identifier = onlyDigits(body?.identifier);
  const type = body?.type === "GB" ? "GB" : "PK";
  const appType = body?.appType === 3 ? 3 : 1;

  if (!identifier) {
    return NextResponse.json({ success: false, error: "VKN/TCKN veya etiket bilgisi girmelisiniz." }, { status: 422 });
  }

  try {
    const login = await loginToHizliBilisim(settings);
    if (!login.success) {
      return NextResponse.json({ success: false, error: `Login başarısız: ${login.note}` }, { status: 502 });
    }

    const result = await getGibUserList(settings, identifier, type, appType, login);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.note }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      data: {
        identifier,
        type,
        appType,
        users: result.users,
        note: result.note,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "GİB kullanıcı sorgulama başarısız oldu.";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}

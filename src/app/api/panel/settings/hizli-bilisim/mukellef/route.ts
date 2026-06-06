import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMukellefBilgisi, loginToHizliBilisim } from "@/lib/integrations/hizli-bilisim";
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
        vknTckn?: string;
        meslekMensubuKey?: string;
      }
    | null;

  const vknTckn = onlyDigits(body?.vknTckn);
  const meslekMensubuKey = body?.meslekMensubuKey?.trim() || settings.serviceMeslekMensubuKey || "";

  if (!vknTckn || !meslekMensubuKey) {
    return NextResponse.json({ success: false, error: "VKN/TCKN ve meslek mensubu key zorunludur." }, { status: 422 });
  }

  try {
    const login = await loginToHizliBilisim(settings);
    if (!login.success) {
      return NextResponse.json({ success: false, error: `Login başarısız: ${login.note}` }, { status: 502 });
    }

    const result = await getMukellefBilgisi(settings, vknTckn, meslekMensubuKey, login);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.note }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      data: {
        vknTckn,
        mukellef: result.mukellef,
        note: result.note,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mükellef bilgisi sorgulaması başarısız oldu.";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}

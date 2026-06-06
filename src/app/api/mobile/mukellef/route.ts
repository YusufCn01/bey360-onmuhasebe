import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMukellefBilgisi, loginToHizliBilisim } from "@/lib/integrations/hizli-bilisim";
import { getMobileTenantContext } from "@/lib/mobile-session";

function onlyDigits(value: string | null | undefined) {
  return String(value ?? "").replace(/\D/g, "");
}

export async function POST(request: NextRequest) {
  const context = await getMobileTenantContext(request);
  if (!context) {
    return NextResponse.json({ success: false, error: { message: "Mobil oturum geçersiz." } }, { status: 401 });
  }

  const settings = await db.eInvoiceSettings.findUnique({ where: { tenantId: context.tenant.id } });
  if (!settings) {
    return NextResponse.json({ success: false, error: { message: "Önce e-Dönüşüm ayarlarını kaydetmelisiniz." } }, { status: 422 });
  }

  const body = (await request.json().catch(() => null)) as { vknTckn?: string; meslekMensubuKey?: string } | null;
  const vknTckn = onlyDigits(body?.vknTckn);
  const meslekMensubuKey = String(body?.meslekMensubuKey ?? settings.serviceMeslekMensubuKey ?? "").trim();

  if (!vknTckn || !meslekMensubuKey) {
    return NextResponse.json(
      { success: false, error: { message: "VKN / TCKN ve meslek mensubu key zorunludur." } },
      { status: 422 },
    );
  }

  try {
    const login = await loginToHizliBilisim(settings);
    if (!login.success) {
      return NextResponse.json({ success: false, error: { message: `Login başarısız: ${login.note}` } }, { status: 502 });
    }

    const result = await getMukellefBilgisi(settings, vknTckn, meslekMensubuKey, login);
    if (!result.success) {
      return NextResponse.json({ success: false, error: { message: result.note } }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      data: {
        vknTckn,
        mukellef: result.mukellef ?? null,
        note: result.note,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: error instanceof Error ? error.message : "TÜRMOB sorgusu başarısız oldu." } },
      { status: 502 },
    );
  }
}

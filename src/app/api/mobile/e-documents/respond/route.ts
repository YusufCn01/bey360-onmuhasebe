import { EInvoiceProvider } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getDocumentList,
  loginToHizliBilisim,
  sendApplicationResponseToHizliBilisim,
} from "@/lib/integrations/hizli-bilisim";
import { getMobileTenantContext } from "@/lib/mobile-session";

function getDefaultRange() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);
  return { startDate, endDate };
}

export async function POST(request: NextRequest) {
  const context = await getMobileTenantContext(request);
  if (!context) {
    return NextResponse.json({ success: false, error: { message: "Mobil oturum geçersiz." } }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        folder?: "inbox" | "outbox";
        uuid?: string | null;
        documentId?: string | null;
        appType?: number | null;
        responseCode?: "KABUL" | "RED";
        responseDescription?: string | null;
      }
    | null;

  const folder = body?.folder ?? "inbox";
  const uuid = String(body?.uuid ?? "").trim();
  const documentId = String(body?.documentId ?? "").trim();
  const appType = Number(body?.appType ?? 1);
  const responseCode = body?.responseCode === "RED" ? "RED" : "KABUL";
  const responseDescription = String(body?.responseDescription ?? "").trim();

  if (!uuid || !documentId) {
    return NextResponse.json({ success: false, error: { message: "Belge kimliği eksik." } }, { status: 422 });
  }

  const settings = await db.eInvoiceSettings.findUnique({ where: { tenantId: context.tenant.id } });
  if (!settings || settings.provider !== EInvoiceProvider.HIZLI_BILISIM) {
    return NextResponse.json({ success: false, error: { message: "Hızlı Bilişim entegratörü aktif değil." } }, { status: 422 });
  }

  const login = await loginToHizliBilisim(settings);
  if (!login.success) {
    return NextResponse.json({ success: false, error: { message: login.note } }, { status: 502 });
  }

  const { startDate, endDate } = getDefaultRange();
  const list = await getDocumentList(
    settings,
    {
      appType: appType || (folder === "inbox" ? 1 : 2),
      startDate,
      endDate,
    },
    login,
  );

  if (!list.success) {
    return NextResponse.json({ success: false, error: { message: list.note } }, { status: 502 });
  }

  const document = list.documents.find((item) => item.uuid === uuid || item.documentId === documentId);
  if (!document?.uuid || !document.documentId || !document.issueDate) {
    return NextResponse.json({ success: false, error: { message: "Yanıt verilecek belge bulunamadı." } }, { status: 404 });
  }

  const result = await sendApplicationResponseToHizliBilisim(
    settings,
    {
      appType: appType === 5 ? 5 : 1,
      responseCode,
      responseDescription,
      documentUUID: document.uuid,
      documentId: document.documentId,
      documentDate: document.issueDate,
    },
    login,
  );

  if (!result.success) {
    return NextResponse.json({ success: false, error: { message: result.note || "Uygulama yanıtı gönderilemedi." } }, { status: 502 });
  }

  return NextResponse.json({
    success: true,
    data: {
      responseCode,
      note: result.note,
      documentId: document.documentId,
    },
  });
}

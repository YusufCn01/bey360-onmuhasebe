import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDocumentFile, loginToHizliBilisim } from "@/lib/integrations/hizli-bilisim";
import { getTenantRouteContext } from "@/lib/session-context";

export async function GET(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const appType = Number(request.nextUrl.searchParams.get("appType") || "0");
  const uuid = request.nextUrl.searchParams.get("uuid")?.trim() || "";
  const type = (request.nextUrl.searchParams.get("type")?.trim().toUpperCase() || "XML") as "XML" | "PDF" | "HTML";
  const documentId = request.nextUrl.searchParams.get("documentId")?.trim() || uuid;

  if (!appType || !uuid || !["XML", "PDF", "HTML"].includes(type)) {
    return NextResponse.json({ success: false, error: "appType, uuid ve type bilgileri zorunludur." }, { status: 422 });
  }

  const settings = await db.eInvoiceSettings.findUnique({ where: { tenantId: context.tenant.id } });
  if (!settings) {
    return NextResponse.json({ success: false, error: "Önce Hızlı Bilişim ayarlarını kaydetmelisiniz." }, { status: 422 });
  }

  try {
    const login = await loginToHizliBilisim(settings);
    if (!login.success) {
      return NextResponse.json({ success: false, error: login.note }, { status: 502 });
    }

    const file = await getDocumentFile(settings, { appType, uuid, type }, login);
    if (!file.success || !file.documentFile) {
      return NextResponse.json({ success: false, error: file.note || "Belge dosyası alınamadı." }, { status: 502 });
    }

    const buffer = Buffer.from(file.documentFile, "base64");
    const contentType = type === "PDF" ? "application/pdf" : type === "HTML" ? "text/html; charset=utf-8" : "application/xml; charset=utf-8";
    const extension = type === "PDF" ? "pdf" : type === "HTML" ? "html" : "xml";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${documentId}.${extension}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Belge dosyası alınamadı.";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}

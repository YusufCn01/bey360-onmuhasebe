import { NextRequest, NextResponse } from "next/server";
import { buildPreliminaryUblXml } from "@/lib/einvoice-ubl";
import { db } from "@/lib/db";
import { getDocumentFile, loginToHizliBilisim } from "@/lib/integrations/hizli-bilisim";
import { getMobileTenantContext } from "@/lib/mobile-session";

type FileType = "XML" | "PDF" | "HTML";

function readType(value: string | null | undefined): FileType {
  const normalized = String(value ?? "").trim().toUpperCase();
  return normalized === "PDF" || normalized === "HTML" ? normalized : "XML";
}

export async function POST(request: NextRequest) {
  const context = await getMobileTenantContext(request);
  if (!context) {
    return NextResponse.json({ success: false, error: { message: "Mobil oturum geçersiz." } }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        folder?: string;
        documentId?: string;
        uuid?: string;
        appType?: number;
        type?: string;
      }
    | null;

  const folder = String(body?.folder ?? "outbox").trim().toLowerCase();
  const documentId = String(body?.documentId ?? "").trim();
  const uuid = String(body?.uuid ?? "").trim();
  const appType = Number(body?.appType ?? 0);
  const type = readType(body?.type);

  if (folder === "drafts") {
    if (!documentId) {
      return NextResponse.json({ success: false, error: { message: "Taslak belge kimliği zorunludur." } }, { status: 422 });
    }

    if (type !== "XML") {
      return NextResponse.json(
        { success: false, error: { message: "Taslak belgeler için şimdilik sadece XML üretilebilir." } },
        { status: 422 },
      );
    }

    const document = await db.eInvoiceDocument.findFirst({
      where: { id: documentId, tenantId: context.tenant.id },
      include: {
        invoice: {
          include: {
            items: { include: { product: true } },
            customer: true,
            supplier: true,
            branch: true,
          },
        },
        tenant: true,
      },
    });

    if (!document) {
      return NextResponse.json({ success: false, error: { message: "Taslak e-belge bulunamadı." } }, { status: 404 });
    }

    const settings = await db.eInvoiceSettings.findUnique({ where: { tenantId: context.tenant.id } });
    const xml = buildPreliminaryUblXml({
      tenant: document.tenant,
      settings,
      document,
      invoice: document.invoice,
    });

    return NextResponse.json({
      success: true,
      data: {
        fileName: `${document.invoice.invoiceNo}.xml`,
        mimeType: "application/xml",
        base64: Buffer.from(xml, "utf-8").toString("base64"),
      },
    });
  }

  if (!uuid || !appType) {
    return NextResponse.json({ success: false, error: { message: "UUID ve appType bilgileri zorunludur." } }, { status: 422 });
  }

  const settings = await db.eInvoiceSettings.findUnique({ where: { tenantId: context.tenant.id } });
  if (!settings) {
    return NextResponse.json({ success: false, error: { message: "Entegratör ayarları bulunamadı." } }, { status: 422 });
  }

  const login = await loginToHizliBilisim(settings);
  if (!login.success) {
    return NextResponse.json({ success: false, error: { message: login.note } }, { status: 502 });
  }

  const file = await getDocumentFile(settings, { appType, uuid, type, isDraft: false }, login);
  if (!file.success || !file.documentFile) {
    return NextResponse.json({ success: false, error: { message: file.note || "Belge dosyası alınamadı." } }, { status: 502 });
  }

  const extension = type === "PDF" ? "pdf" : type === "HTML" ? "html" : "xml";
  const mimeType = type === "PDF" ? "application/pdf" : type === "HTML" ? "text/html" : "application/xml";

  return NextResponse.json({
    success: true,
    data: {
      fileName: `${documentId || uuid}.${extension}`,
      mimeType,
      base64: file.documentFile,
    },
  });
}

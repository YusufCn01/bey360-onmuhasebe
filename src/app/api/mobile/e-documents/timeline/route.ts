import { EInvoiceProvider } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDocumentList, loginToHizliBilisim } from "@/lib/integrations/hizli-bilisim";
import { getMobileTenantContext } from "@/lib/mobile-session";

function getDefaultRange() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);
  return { startDate, endDate };
}

function formatDate(value?: string | Date | null) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export async function POST(request: NextRequest) {
  const context = await getMobileTenantContext(request);
  if (!context) {
    return NextResponse.json({ success: false, error: { message: "Mobil oturum geçersiz." } }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        folder?: "drafts" | "inbox" | "outbox";
        uuid?: string | null;
        documentId?: string | null;
        appType?: number | null;
      }
    | null;

  const folder = body?.folder ?? "outbox";
  const uuid = String(body?.uuid ?? "").trim();
  const documentId = String(body?.documentId ?? "").trim();
  const appType = Number(body?.appType ?? 0);

  if (folder === "drafts") {
    const draft = await db.eInvoiceDocument.findFirst({
      where: {
        tenantId: context.tenant.id,
        OR: [{ id: documentId }, { externalId: uuid || undefined }],
      },
      include: { invoice: true },
    });

    if (!draft) {
      return NextResponse.json({ success: false, error: { message: "Taslak belge bulunamadı." } }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        timeline: [
          { title: "Belge oluşturuldu", detail: formatDate(draft.createdAt), tone: "success" },
          { title: "Belge durumu", detail: draft.status, tone: "neutral" },
          { title: "Belge tarihi", detail: formatDate(draft.invoice.issueDate), tone: "neutral" },
          { title: "Zarf UUID", detail: draft.envelopeUuid || "-", tone: "neutral" },
          { title: "Servis notu", detail: draft.responseNote || "Taslak belge hazır.", tone: "neutral" },
        ],
        meta: {
          invoiceNo: draft.invoice.invoiceNo,
          envelopeUuid: draft.envelopeUuid ?? null,
          providerNote: draft.responseNote ?? null,
        },
      },
    });
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
  const result = await getDocumentList(
    settings,
    {
      appType: appType || (folder === "inbox" ? 1 : 2),
      startDate,
      endDate,
    },
    login,
  );

  if (!result.success) {
    return NextResponse.json({ success: false, error: { message: result.note } }, { status: 502 });
  }

  const document = result.documents.find(
    (item) =>
      (uuid && item.uuid === uuid) ||
      (documentId && item.documentId === documentId),
  );

  if (!document) {
    return NextResponse.json({ success: false, error: { message: "Belge zaman çizelgesi bulunamadı." } }, { status: 404 });
  }

  const timeline = [
    { title: "Belge tarihi", detail: formatDate(document.issueDate), tone: "neutral" },
    { title: "Entegratör işlem tarihi", detail: formatDate(document.createdDate), tone: "neutral" },
    { title: "Belge durumu", detail: document.statusExp || "-", tone: "success" },
    { title: "Zarf durumu", detail: document.envelopeExp || "-", tone: "neutral" },
    { title: "Zarf kodu", detail: document.envelopeStatus != null ? String(document.envelopeStatus) : "-", tone: "neutral" },
    { title: "Servis notu", detail: document.message || "-", tone: "neutral" },
    ...(document.cancelDate ? [{ title: "İptal tarihi", detail: formatDate(document.cancelDate), tone: "danger" }] : []),
  ];

  return NextResponse.json({
    success: true,
    data: {
      timeline,
      meta: {
        invoiceNo: document.documentId ?? null,
        envelopeUuid: document.envelopeUuid ?? null,
        sourceAlias: document.sourceAlias ?? null,
        targetAlias: document.targetAlias ?? null,
        localReferenceId: document.localReferenceId ?? null,
        providerNote: document.message ?? null,
      },
    },
  });
}

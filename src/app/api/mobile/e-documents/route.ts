import { EInvoiceProvider } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDocumentList, loginToHizliBilisim } from "@/lib/integrations/hizli-bilisim";
import { getMobileTenantContext } from "@/lib/mobile-session";

function getDateRange(startDateRaw?: string | null, endDateRaw?: string | null) {
  const endDate = endDateRaw ? new Date(endDateRaw) : new Date();
  const startDate = startDateRaw ? new Date(startDateRaw) : new Date();
  if (!startDateRaw) {
    startDate.setMonth(startDate.getMonth() - 3);
  }
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    const safeEndDate = new Date();
    const safeStartDate = new Date();
    safeStartDate.setMonth(safeStartDate.getMonth() - 3);
    return { startDate: safeStartDate, endDate: safeEndDate };
  }
  return { startDate, endDate };
}

export async function GET(request: NextRequest) {
  const context = await getMobileTenantContext(request);
  if (!context) {
    return NextResponse.json({ success: false, error: { message: "Mobil oturum geçersiz." } }, { status: 401 });
  }

  const folder = request.nextUrl.searchParams.get("folder") ?? "outbox";
  const startDateRaw = request.nextUrl.searchParams.get("startDate");
  const endDateRaw = request.nextUrl.searchParams.get("endDate");
  const settings = await db.eInvoiceSettings.findUnique({ where: { tenantId: context.tenant.id } });
  const { startDate, endDate } = getDateRange(startDateRaw, endDateRaw);

  if (folder === "drafts") {
    const drafts = await db.eInvoiceDocument.findMany({
      where: { tenantId: context.tenant.id, status: { in: ["DRAFT", "READY"] } },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        invoice: {
          select: {
            invoiceNo: true,
            issueDate: true,
            grandTotal: true,
            customer: { select: { name: true, taxNumber: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: drafts.map((item) => ({
        id: item.id,
        uuid: item.externalId ?? item.id,
        appType: item.scenario === "E_ARCHIVE" ? 3 : 2,
        invoiceNo: item.invoice.invoiceNo,
        title: item.invoice.customer?.name ?? "Muhtelif Müşteriler",
        subtitle: `${item.scenario} · Taslak belge`,
        identifier: item.invoice.customer?.taxNumber ?? "-",
        amount: item.invoice.grandTotal,
        currencyCode: "TRY",
        issueDate: item.invoice.issueDate.toISOString(),
        status: item.status,
        statusExp: item.status,
        envelopeUuid: item.envelopeUuid ?? null,
        envelopeStatus: null,
        envelopeExp: item.responseNote ?? item.status,
        message: item.responseNote ?? null,
      })),
    });
  }

  if (!settings || settings.provider !== EInvoiceProvider.HIZLI_BILISIM) {
    return NextResponse.json({ success: false, error: { message: "Hızlı Bilişim entegratörü aktif değil." } }, { status: 422 });
  }

  const login = await loginToHizliBilisim(settings);
  if (!login.success) {
    return NextResponse.json({ success: false, error: { message: login.note } }, { status: 502 });
  }

  const requests =
    folder === "inbox"
      ? [getDocumentList(settings, { appType: 1, startDate, endDate }, login)]
      : [
          getDocumentList(settings, { appType: 2, startDate, endDate }, login),
          getDocumentList(settings, { appType: 3, startDate, endDate }, login),
        ];

  const results = await Promise.all(requests);
  const failed = results.find((item) => !item.success);
  if (failed) {
    return NextResponse.json({ success: false, error: { message: failed.note } }, { status: 502 });
  }

  const documents = results
    .flatMap((item) => item.documents)
    .sort((left, right) => {
      const leftDate = new Date(left.issueDate ?? left.createdDate ?? 0).getTime();
      const rightDate = new Date(right.issueDate ?? right.createdDate ?? 0).getTime();
      return rightDate - leftDate;
    })
    .slice(0, 40);

  return NextResponse.json({
    success: true,
    data: documents.map((item) => ({
      id: `${item.appType ?? 0}-${item.uuid ?? item.documentId ?? Math.random().toString(36)}`,
      uuid: item.uuid,
      appType: item.appType,
      invoiceNo: item.documentId ?? "-",
      title: item.targetTitle ?? "-",
      subtitle: `${item.isArchive ? "e-Arşiv" : "e-Fatura"} · ${folder === "inbox" ? "Gelen" : "Giden"} belge`,
      identifier: item.targetIdentifier ?? "-",
      amount: item.payableAmount ?? 0,
      currencyCode: item.documentCurrencyCode ?? "TRY",
      issueDate: item.issueDate ?? item.createdDate ?? null,
      status: item.statusExp ?? "-",
      statusExp: item.envelopeExp ?? item.statusExp ?? "-",
      envelopeUuid: item.envelopeUuid ?? null,
      envelopeStatus: item.envelopeStatus ?? null,
      envelopeExp: item.envelopeExp ?? item.statusExp ?? null,
      message: item.message ?? null,
    })),
  });
}

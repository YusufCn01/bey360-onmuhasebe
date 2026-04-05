import { EInvoiceDocumentStatus, EInvoiceScenario } from "@prisma/client";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { buildPreliminaryUblXml } from "@/lib/einvoice-ubl";
import { getGibUserList, sendInvoiceToHizliBilisim } from "@/lib/integrations/hizli-bilisim";
import { getTenantRouteContext } from "@/lib/session-context";

function isNotEInvoiceTaxpayer(note: string | null | undefined) {
  const normalized = (note ?? "").toLocaleLowerCase("tr-TR");
  return normalized.includes("mükellefi değil") || normalized.includes("mukellefi degil");
}

export async function POST(_: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const { documentId } = await params;
  const document = await db.eInvoiceDocument.findFirst({
    where: { id: documentId, tenantId: context.tenant.id },
    include: {
      invoice: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
          supplier: true,
          branch: true,
        },
      },
      tenant: true,
    },
  });

  if (!document) {
    return NextResponse.json({ success: false, error: "e-Belge kaydı bulunamadı." }, { status: 404 });
  }

  const settings = await db.eInvoiceSettings.findUnique({ where: { tenantId: context.tenant.id } });
  if (!settings || settings.provider === "NONE") {
    return NextResponse.json({ success: false, error: "Önce e-Fatura sağlayıcısını seçmelisiniz." }, { status: 422 });
  }

  try {
    if (settings.provider === "HIZLI_BILISIM") {
      let workingDocument = document;
      const taxNumber = workingDocument.invoice.customer?.taxNumber?.trim();

      if (taxNumber && taxNumber.length >= 10) {
        const lookup = await getGibUserList(settings, taxNumber, "PK", 1);
        const matchedAlias = lookup.success ? lookup.users[0]?.Alias ?? "" : "";
        const taxpayer = Boolean(matchedAlias);
        const notTaxpayer = isNotEInvoiceTaxpayer(lookup.note);

        if (!lookup.success && !notTaxpayer) {
          return NextResponse.json({ success: false, error: lookup.note || "Alıcı e-Fatura durumu doğrulanamadı." }, { status: 502 });
        }

        if (workingDocument.invoice.customerId) {
          await db.customer.update({
            where: { id: workingDocument.invoice.customerId },
            data: {
              eInvoiceRegistered: taxpayer,
              eInvoiceAlias: taxpayer ? matchedAlias : null,
              eInvoiceCheckNote: taxpayer ? `e-Fatura mükellefi · PK alias: ${matchedAlias}` : lookup.note,
              eInvoiceCheckedAt: new Date(),
            },
          });
        }

        if (taxpayer && workingDocument.scenario === EInvoiceScenario.E_ARCHIVE) {
          const upgradedDocument = await db.eInvoiceDocument.update({
            where: { id: workingDocument.id },
            data: {
              scenario: EInvoiceScenario.E_INVOICE_BASIC,
              status: EInvoiceDocumentStatus.READY,
              destinationUrn: matchedAlias,
              responseNote: "Alıcı e-Fatura mükellefi olduğu için belge e-Fatura olarak hazırlandı.",
            },
          });

          workingDocument = {
            ...workingDocument,
            ...upgradedDocument,
          };
        }

        if (!taxpayer && workingDocument.scenario !== EInvoiceScenario.E_ARCHIVE && settings.archiveEnabled) {
          const downgradedDocument = await db.eInvoiceDocument.update({
            where: { id: workingDocument.id },
            data: {
              scenario: EInvoiceScenario.E_ARCHIVE,
              status: EInvoiceDocumentStatus.READY,
              destinationUrn: null,
              responseNote: "Alıcı e-Fatura mükellefi olmadığı için belge e-Arşiv olarak yeniden hazırlanıyor.",
            },
          });

          workingDocument = {
            ...workingDocument,
            ...downgradedDocument,
          };
        }
      }

      let xmlContent = buildPreliminaryUblXml({
        tenant: workingDocument.tenant,
        settings,
        document: workingDocument,
        invoice: workingDocument.invoice,
      });

      let result = await sendInvoiceToHizliBilisim({
        tenant: workingDocument.tenant,
        settings,
        document: workingDocument,
        invoice: workingDocument.invoice,
        xmlContent,
      });

      if (
        !result.success &&
        workingDocument.scenario !== EInvoiceScenario.E_ARCHIVE &&
        settings.archiveEnabled &&
        isNotEInvoiceTaxpayer(result.note)
      ) {
        if (workingDocument.invoice.customerId) {
          await db.customer.update({
            where: { id: workingDocument.invoice.customerId },
            data: {
              eInvoiceRegistered: false,
              eInvoiceAlias: null,
              eInvoiceCheckNote: result.note,
              eInvoiceCheckedAt: new Date(),
            },
          });
        }

        const downgradedDocument = await db.eInvoiceDocument.update({
          where: { id: workingDocument.id },
          data: {
            scenario: EInvoiceScenario.E_ARCHIVE,
            status: EInvoiceDocumentStatus.READY,
            destinationUrn: null,
            responseNote: "Alıcı e-Fatura mükellefi olmadığı için belge e-Arşiv olarak yeniden hazırlanıyor.",
          },
        });

        workingDocument = {
          ...workingDocument,
          ...downgradedDocument,
        };

        xmlContent = buildPreliminaryUblXml({
          tenant: workingDocument.tenant,
          settings,
          document: workingDocument,
          invoice: workingDocument.invoice,
        });

        result = await sendInvoiceToHizliBilisim({
          tenant: workingDocument.tenant,
          settings,
          document: workingDocument,
          invoice: workingDocument.invoice,
          xmlContent,
        });

        if (result.success) {
          result = {
            ...result,
            note: `Alıcı e-Fatura mükellefi olmadığı için belge e-Arşiv olarak gönderildi. ${result.note}`,
          };
        }
      }

      const updated = await db.eInvoiceDocument.update({
        where: { id: workingDocument.id },
        data: {
          status: result.success ? EInvoiceDocumentStatus.SENT : EInvoiceDocumentStatus.FAILED,
          scenario: workingDocument.scenario,
          externalId: result.externalId ?? workingDocument.externalId,
          envelopeUuid: result.envelopeUuid ?? workingDocument.envelopeUuid,
          sourceUrn: result.sourceUrn ?? workingDocument.sourceUrn,
          destinationUrn: result.destinationUrn ?? workingDocument.destinationUrn,
          responseNote: result.note,
        },
      });

      revalidatePath("/panel/ayarlar/e-fatura");
      revalidatePath("/panel/faturalar");
      revalidatePath("/panel/satis-faturalari");
      revalidatePath("/panel/cari/musteriler");
      return result.success
        ? NextResponse.json({ success: true, data: updated })
        : NextResponse.json({ success: false, error: result.note, data: updated }, { status: 502 });
    }

    const updated = await db.eInvoiceDocument.update({
      where: { id: document.id },
      data: {
        status: EInvoiceDocumentStatus.SENT,
        externalId: `GIB-${Date.now()}`,
        envelopeUuid: crypto.randomUUID(),
        responseNote: "GİB e-Arşiv gönderimi demo modda başarılı.",
      },
    });

    revalidatePath("/panel/ayarlar/e-fatura");
    revalidatePath("/panel/faturalar");
    revalidatePath("/panel/satis-faturalari");
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Belge gönderimi sırasında beklenmeyen bir hata oluştu.";
    const failed = await db.eInvoiceDocument.update({
      where: { id: document.id },
      data: {
        status: EInvoiceDocumentStatus.FAILED,
        responseNote: message,
      },
    });

    revalidatePath("/panel/ayarlar/e-fatura");
    revalidatePath("/panel/faturalar");
    revalidatePath("/panel/satis-faturalari");
    return NextResponse.json({ success: false, error: message, data: failed }, { status: 502 });
  }
}

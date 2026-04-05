import { EInvoiceProvider } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        provider?: EInvoiceProvider;
        senderTitle?: string;
        senderTaxNumber?: string;
        gibAlias?: string;
        archiveEnabled?: boolean;
        autoSend?: boolean;
        testMode?: boolean;
      }
    | null;

  const settings = await db.eInvoiceSettings.upsert({
    where: { tenantId: context.tenant.id },
    update: {
      provider: body?.provider ?? EInvoiceProvider.NONE,
      senderTitle: body?.senderTitle?.trim() || null,
      senderTaxNumber: body?.senderTaxNumber?.trim() || null,
      gibAlias: body?.gibAlias?.trim() || null,
      archiveEnabled: Boolean(body?.archiveEnabled),
      autoSend: Boolean(body?.autoSend),
      testMode: body?.testMode ?? true,
    },
    create: {
      tenantId: context.tenant.id,
      provider: body?.provider ?? EInvoiceProvider.NONE,
      senderTitle: body?.senderTitle?.trim() || null,
      senderTaxNumber: body?.senderTaxNumber?.trim() || null,
      gibAlias: body?.gibAlias?.trim() || null,
      archiveEnabled: Boolean(body?.archiveEnabled),
      autoSend: Boolean(body?.autoSend),
      testMode: body?.testMode ?? true,
    },
  });

  revalidatePath("/panel/ayarlar/e-fatura");
  revalidatePath("/panel/faturalar");
  return NextResponse.json({ success: true, data: settings });
}

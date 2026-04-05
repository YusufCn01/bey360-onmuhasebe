import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { normalizeTemplateContent } from "@/lib/document-template-presets";
import { getTenantRouteContext } from "@/lib/session-context";

export async function PATCH(request: NextRequest, context: { params: Promise<{ templateId: string }> }) {
  const routeContext = await getTenantRouteContext();
  if (!routeContext) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const { templateId } = await context.params;
  const body = (await request.json().catch(() => null)) as { name?: string; isDefault?: boolean; contentJson?: string } | null;
  const template = await db.documentTemplate.findFirst({
    where: { id: templateId, tenantId: routeContext.tenant.id },
  });

  if (!template) {
    return NextResponse.json({ success: false, error: "Şablon bulunamadı." }, { status: 404 });
  }

  const normalizedContent = normalizeTemplateContent(body?.contentJson ?? template.contentJson, template.kind);

  await db.$transaction(async (tx) => {
    if (body?.isDefault) {
      await tx.documentTemplate.updateMany({
        where: { tenantId: routeContext.tenant.id, kind: template.kind, NOT: { id: template.id } },
        data: { isDefault: false },
      });
    }

    await tx.documentTemplate.update({
      where: { id: template.id },
      data: {
        name: body?.name?.trim() || template.name,
        isDefault: body?.isDefault ?? template.isDefault,
        contentJson: JSON.stringify(normalizedContent),
      },
    });
  });

  revalidatePath("/panel/ayarlar/sablonlar/fatura");
  revalidatePath("/panel/ayarlar/sablonlar/irsaliye");
  revalidatePath("/panel/ayarlar/sablonlar/teklif");
  revalidatePath("/panel/ayarlar/sablonlar");

  return NextResponse.json({ success: true });
}

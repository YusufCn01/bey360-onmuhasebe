import { db } from "@/lib/db";
import { getTemplatePresets, type TemplateKind } from "@/lib/document-template-presets";

export async function ensureDocumentTemplates(tenantId: string, kind: TemplateKind) {
  const existing = await db.documentTemplate.findMany({
    where: { tenantId, kind },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  const presets = getTemplatePresets(kind);
  const existingSlugs = new Set(existing.map((item) => item.slug));
  const missingPresets = presets.filter((preset) => !existingSlugs.has(preset.slug));

  if (missingPresets.length > 0) {
    await db.documentTemplate.createMany({
      data: missingPresets.map((preset, index) => ({
        tenantId,
        kind,
        name: preset.name,
        slug: preset.slug,
        isDefault: existing.length === 0 && index === 0,
        contentJson: JSON.stringify(preset.content),
      })),
    });
  }

  const templates = await db.documentTemplate.findMany({
    where: { tenantId, kind },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  if (!templates.some((item) => item.isDefault) && templates[0]) {
    await db.documentTemplate.update({
      where: { id: templates[0].id },
      data: { isDefault: true },
    });
    return db.documentTemplate.findMany({
      where: { tenantId, kind },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
  }

  return templates;
}

export async function getDefaultDocumentTemplate(tenantId: string, kind: TemplateKind) {
  const templates = await ensureDocumentTemplates(tenantId, kind);
  return templates.find((item) => item.isDefault) ?? templates[0] ?? null;
}

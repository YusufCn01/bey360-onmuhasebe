import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getTenantRouteContext } from "@/lib/session-context";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);

const extensionByMime: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
};

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, "").slice(0, 40) || "file";
}

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısın." }, { status: 401 });
  }

  const formData = (await request.formData().catch(() => null)) as globalThis.FormData | null;
  const file = formData?.get("file");
  const category = sanitizeSegment(String(formData?.get("category") || "general").toLowerCase());

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: "Yüklenecek dosya bulunamadı." }, { status: 422 });
  }

  if (!allowedMimeTypes.has(file.type)) {
    return NextResponse.json({ success: false, error: "Sadece JPG, PNG, WEBP veya SVG yükleyebilirsin." }, { status: 422 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ success: false, error: "Dosya boyutu 5 MB sınırını aşıyor." }, { status: 422 });
  }

  const extension = extensionByMime[file.type] || path.extname(file.name) || ".bin";
  const fileName = `${category}-${randomUUID()}${extension}`;
  const relativeDir = path.join("uploads", "tenants", context.tenant.id, category);
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  const absolutePath = path.join(absoluteDir, fileName);

  await mkdir(absoluteDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  return NextResponse.json({
    success: true,
    data: {
      url: `/${relativeDir.replace(/\\/g, "/")}/${fileName}`,
      size: file.size,
      type: file.type,
    },
  });
}

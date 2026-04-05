import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ supplierId: string }> }) {
  const context = await getTenantRouteContext();
  if (!context) return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });

  const { supplierId } = await params;
  const existing = await db.supplier.findFirst({ where: { id: supplierId, tenantId: context.tenant.id } });
  if (!existing) return NextResponse.json({ success: false, error: "Tedarikçi bulunamadı." }, { status: 404 });

  const body = (await request.json().catch(() => null)) as Record<string, string> | null;
  const code = body?.code?.trim() ?? "";
  const name = body?.name?.trim() ?? "";
  if (!code || !name) return NextResponse.json({ success: false, error: "Tedarikçi kodu ve firma adı zorunludur." }, { status: 422 });

  const duplicate = await db.supplier.findFirst({ where: { tenantId: context.tenant.id, code, id: { not: supplierId } } });
  if (duplicate) return NextResponse.json({ success: false, error: "Bu tedarikçi kodu başka bir kartta kullanılıyor." }, { status: 409 });

  const supplier = await db.supplier.update({
    where: { id: supplierId },
    data: {
      code,
      name,
      phone: body?.phone?.trim() || null,
      email: body?.email?.trim() || null,
      city: body?.city?.trim() || null,
    },
  });

  revalidatePath("/panel/cari");
  revalidatePath("/panel");
  return NextResponse.json({ success: true, data: supplier });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ supplierId: string }> }) {
  const context = await getTenantRouteContext();
  if (!context) return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });

  const { supplierId } = await params;
  const supplier = await db.supplier.findFirst({ where: { id: supplierId, tenantId: context.tenant.id }, include: { invoices: { take: 1 } } });
  if (!supplier) return NextResponse.json({ success: false, error: "Tedarikçi bulunamadı." }, { status: 404 });
  if (supplier.invoices.length) return NextResponse.json({ success: false, error: "Bu tedarikçi alış faturalarıyla bağlı olduğu için silinemez." }, { status: 409 });

  await db.supplier.delete({ where: { id: supplierId } });
  revalidatePath("/panel/cari");
  revalidatePath("/panel");
  return NextResponse.json({ success: true });
}
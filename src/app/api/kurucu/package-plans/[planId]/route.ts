import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getFounderRouteContext } from "@/lib/session-context";

function normalizeCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  const context = await getFounderRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: { message: "Bu işlem için kurucu oturumu gerekli." } }, { status: 403 });
  }

  const { planId } = await params;
  const body = (await request.json().catch(() => null)) as
    | {
        code?: string;
        name?: string;
        monthlyPrice?: number | string;
        yearlyPrice?: number | string;
        userLimit?: number | string;
        branchLimit?: number | string;
        isActive?: boolean;
      }
    | null;

  const current = await db.packagePlan.findUnique({ where: { id: planId } });
  if (!current) {
    return NextResponse.json({ success: false, error: { message: "Paket planı bulunamadı." } }, { status: 404 });
  }

  const code = body?.code ? normalizeCode(body.code) : current.code;
  const name = body?.name?.trim() || current.name;
  const monthlyPrice = body?.monthlyPrice === undefined ? current.monthlyPrice : Number(body.monthlyPrice);
  const yearlyPrice = body?.yearlyPrice === undefined ? current.yearlyPrice : Number(body.yearlyPrice);
  const userLimit = body?.userLimit === undefined ? current.userLimit : Number(body.userLimit);
  const branchLimit = body?.branchLimit === undefined ? current.branchLimit : Number(body.branchLimit);

  if (!name || !code) {
    return NextResponse.json({ success: false, error: { message: "Paket adı ve kodu zorunludur." } }, { status: 422 });
  }

  if (![monthlyPrice, yearlyPrice, userLimit, branchLimit].every(Number.isFinite) || monthlyPrice < 0 || yearlyPrice < 0 || userLimit < 1 || branchLimit < 1) {
    return NextResponse.json({ success: false, error: { message: "Paket sayısal alanları geçerli olmalıdır." } }, { status: 422 });
  }

  const existing = await db.packagePlan.findFirst({ where: { code, id: { not: planId } } });
  if (existing) {
    return NextResponse.json({ success: false, error: { message: "Bu paket kodu zaten kullanılıyor." } }, { status: 409 });
  }

  const plan = await db.packagePlan.update({
    where: { id: planId },
    data: {
      code,
      name,
      monthlyPrice,
      yearlyPrice,
      userLimit,
      branchLimit,
      isActive: body?.isActive ?? current.isActive,
    },
  });

  revalidatePath("/kurucu");
  revalidatePath("/kurucu/paketler");
  revalidatePath("/kurucu/tenantlar");
  revalidatePath("/kurucu/bayi-basvurulari");

  return NextResponse.json({ success: true, data: plan });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  const context = await getFounderRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: { message: "Bu işlem için kurucu oturumu gerekli." } }, { status: 403 });
  }

  const { planId } = await params;
  const plan = await db.packagePlan.findUnique({
    where: { id: planId },
    include: { _count: { select: { tenants: true, applications: true } } },
  });

  if (!plan) {
    return NextResponse.json({ success: false, error: { message: "Paket planı bulunamadı." } }, { status: 404 });
  }

  if (plan._count.tenants > 0 || plan._count.applications > 0) {
    return NextResponse.json({ success: false, error: { message: "Bu paket planı tenant veya bayi başvurularında kullanılıyor." } }, { status: 409 });
  }

  await db.packagePlan.delete({ where: { id: planId } });

  revalidatePath("/kurucu");
  revalidatePath("/kurucu/paketler");
  revalidatePath("/kurucu/tenantlar");
  revalidatePath("/kurucu/bayi-basvurulari");

  return NextResponse.json({ success: true });
}

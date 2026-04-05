import { revalidatePath } from "next/cache";
import { TenantStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getFounderRouteContext } from "@/lib/session-context";

const allowedStatuses = new Set<TenantStatus>(["TRIAL", "ACTIVE", "SUSPENDED"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const context = await getFounderRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: { message: "Bu işlem için kurucu oturumu gerekli." } }, { status: 403 });
  }

  const { tenantId } = await params;
  const body = (await request.json().catch(() => null)) as
    | {
        status?: TenantStatus;
        packagePlanId?: string | null;
      }
    | null;

  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json({ success: false, error: { message: "Tenant bulunamadı." } }, { status: 404 });
  }

  const status = body?.status && allowedStatuses.has(body.status) ? body.status : tenant.status;
  const packagePlanId = body?.packagePlanId?.trim() ? body.packagePlanId.trim() : null;

  let packagePlan = null;
  if (packagePlanId) {
    packagePlan = await db.packagePlan.findFirst({ where: { id: packagePlanId, isActive: true } });
    if (!packagePlan) {
      return NextResponse.json({ success: false, error: { message: "Seçilen paket planı bulunamadı veya pasif." } }, { status: 404 });
    }
  }

  const updatedTenant = await db.tenant.update({
    where: { id: tenantId },
    data: {
      status,
      packagePlanId: packagePlan?.id ?? null,
      planName: packagePlan?.name ?? tenant.planName,
    },
    include: { packagePlan: true },
  });

  revalidatePath("/kurucu");
  revalidatePath("/kurucu/tenantlar");
  revalidatePath("/panel/ayarlar/firma");

  return NextResponse.json({ success: true, data: updatedTenant });
}

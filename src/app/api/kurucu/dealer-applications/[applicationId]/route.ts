import { revalidatePath } from "next/cache";
import { DealerApplicationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getFounderRouteContext } from "@/lib/session-context";

const allowedStatuses = new Set<DealerApplicationStatus>(["NEW", "REVIEWING", "APPROVED", "REJECTED"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const context = await getFounderRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: { message: "Bu işlem için kurucu oturumu gerekli." } }, { status: 403 });
  }

  const { applicationId } = await params;
  const body = (await request.json().catch(() => null)) as
    | {
        status?: DealerApplicationStatus;
        commissionRate?: number | string;
        packagePlanId?: string | null;
      }
    | null;

  const application = await db.dealerApplication.findUnique({ where: { id: applicationId } });
  if (!application) {
    return NextResponse.json({ success: false, error: { message: "Bayi başvurusu bulunamadı." } }, { status: 404 });
  }

  const status = body?.status && allowedStatuses.has(body.status) ? body.status : application.status;
  const commissionRate = body?.commissionRate === undefined || body?.commissionRate === null || body?.commissionRate === ""
    ? application.commissionRate
    : Number(body.commissionRate);

  if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100) {
    return NextResponse.json({ success: false, error: { message: "Komisyon oranı 0 ile 100 arasında olmalıdır." } }, { status: 422 });
  }

  const packagePlanId = body?.packagePlanId?.trim() ? body.packagePlanId.trim() : null;
  let packagePlan = null;
  if (packagePlanId) {
    packagePlan = await db.packagePlan.findFirst({ where: { id: packagePlanId, isActive: true } });
    if (!packagePlan) {
      return NextResponse.json({ success: false, error: { message: "Seçilen paket planı bulunamadı veya pasif." } }, { status: 404 });
    }
  }

  const updatedApplication = await db.dealerApplication.update({
    where: { id: applicationId },
    data: {
      status,
      commissionRate,
      packagePlanId: packagePlan?.id ?? null,
    },
    include: { packagePlan: true, tenant: true },
  });

  revalidatePath("/kurucu");
  revalidatePath("/kurucu/bayi-basvurulari");
  revalidatePath("/kurucu/tenantlar");

  return NextResponse.json({ success: true, data: updatedApplication });
}

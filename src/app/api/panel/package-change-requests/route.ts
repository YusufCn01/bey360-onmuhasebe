import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Oturum bulunamadı." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        targetPlanId?: string;
        note?: string;
      }
    | null;

  const targetPlanId = body?.targetPlanId?.trim() || "";
  if (!targetPlanId) {
    return NextResponse.json({ success: false, error: "Hedef paket seçilmelidir." }, { status: 422 });
  }

  const [plan, openRequest] = await Promise.all([
    db.packagePlan.findFirst({ where: { id: targetPlanId, isActive: true } }),
    db.packageChangeRequest.findFirst({
      where: { tenantId: context.tenant.id, status: "OPEN" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!plan) {
    return NextResponse.json({ success: false, error: "Seçilen paket bulunamadı." }, { status: 404 });
  }

  if (openRequest) {
    return NextResponse.json({ success: false, error: "Önce açık paket değişim talebini sonuçlandırmalısın." }, { status: 409 });
  }

  if (context.tenant.packagePlanId === plan.id || context.tenant.planName === plan.name) {
    return NextResponse.json({ success: false, error: "Bu paket zaten aktif görünüyor." }, { status: 409 });
  }

  const requestRecord = await db.packageChangeRequest.create({
    data: {
      tenantId: context.tenant.id,
      targetPlanId: plan.id,
      currentPlanName: context.tenant.planName,
      note: body?.note?.trim() || null,
    },
    include: { targetPlan: true },
  });

  return NextResponse.json({ success: true, data: requestRecord });
}

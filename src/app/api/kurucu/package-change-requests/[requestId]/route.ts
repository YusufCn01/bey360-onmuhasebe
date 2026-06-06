import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createReminder } from "@/lib/reminders";
import { getFounderRouteContext } from "@/lib/session-context";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const context = await getFounderRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: { message: "Bu işlem için kurucu oturumu gerekli." } }, { status: 403 });
  }

  const { requestId } = await params;
  const body = (await request.json().catch(() => null)) as { action?: "approve" | "reject"; reviewNote?: string } | null;
  const action = body?.action;
  const reviewNote = body?.reviewNote?.trim() || null;

  if (!action) {
    return NextResponse.json({ success: false, error: { message: "İşlem türü zorunludur." } }, { status: 422 });
  }

  const current = await db.packageChangeRequest.findUnique({
    where: { id: requestId },
    include: { tenant: true, targetPlan: true },
  });

  if (!current) {
    return NextResponse.json({ success: false, error: { message: "Talep bulunamadı." } }, { status: 404 });
  }

  if (current.status !== "OPEN") {
    return NextResponse.json({ success: false, error: { message: "Bu talep zaten sonuçlandırılmış." } }, { status: 409 });
  }

  if (action === "approve") {
    const result = await db.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: current.tenantId },
        data: {
          packagePlanId: current.targetPlanId,
          planName: current.targetPlan.name,
          status: "ACTIVE",
        },
      });

      return tx.packageChangeRequest.update({
        where: { id: current.id },
        data: {
          status: "APPROVED",
          reviewNote,
          reviewedAt: new Date(),
          reviewedByName: context.user.fullName,
        },
      });
    });

    await createReminder({
      tenantId: current.tenantId,
      title: "Paket talebin onaylandı",
      message: `${current.targetPlan.name} planı kullanımına açıldı. Yeni limitlerin şimdi aktif.${reviewNote ? ` Not: ${reviewNote}` : ""}`,
      dueAt: new Date(),
      relatedType: "PACKAGE_CHANGE_REQUEST",
      relatedId: current.id,
    });

    return NextResponse.json({ success: true, data: result });
  }

  const result = await db.packageChangeRequest.update({
    where: { id: current.id },
    data: {
      status: "REJECTED",
      reviewNote,
      reviewedAt: new Date(),
      reviewedByName: context.user.fullName,
    },
  });

  await createReminder({
    tenantId: current.tenantId,
    title: "Paket talebin değerlendirildi",
    message: `${current.targetPlan.name} için açılan talep şu an onaylanmadı. Gerekirse yeni bir talep oluşturabilirsin.${reviewNote ? ` Not: ${reviewNote}` : ""}`,
    dueAt: new Date(),
    relatedType: "PACKAGE_CHANGE_REQUEST",
    relatedId: current.id,
  });

  return NextResponse.json({ success: true, data: result });
}

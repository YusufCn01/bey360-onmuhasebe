import { revalidatePath } from "next/cache";
import { CrmTaskPriority, CrmTaskStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

const taskStatuses = new Set<CrmTaskStatus>(["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"]);
const taskPriorities = new Set<CrmTaskPriority>(["LOW", "NORMAL", "HIGH"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu islem icin giris yapmalisiniz." }, { status: 403 });
  }

  const { taskId } = await params;
  const task = await db.crmTask.findFirst({ where: { id: taskId, tenantId: context.tenant.id } });
  if (!task) {
    return NextResponse.json({ success: false, error: "Gorev bulunamadi." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        leadId?: string | null;
        assignedUserId?: string | null;
        title?: string;
        dueAt?: string | null;
        status?: CrmTaskStatus;
        priority?: CrmTaskPriority;
        note?: string;
      }
    | null;

  const updateData: {
    leadId?: string | null;
    assignedUserId?: string | null;
    title?: string;
    dueAt?: Date | null;
    status?: CrmTaskStatus;
    priority?: CrmTaskPriority;
    note?: string | null;
  } = {};

  if (typeof body?.leadId !== "undefined") {
    const leadId = body.leadId?.trim() || null;
    if (leadId) {
      const lead = await db.crmLead.findFirst({ where: { id: leadId, tenantId: context.tenant.id } });
      if (!lead) {
        return NextResponse.json({ success: false, error: "Bagli firsat bulunamadi." }, { status: 404 });
      }
    }
    updateData.leadId = leadId;
  }

  if (typeof body?.assignedUserId !== "undefined") {
    const assignedUserId = body.assignedUserId?.trim() || null;
    if (assignedUserId) {
      const membership = await db.membership.findFirst({ where: { tenantId: context.tenant.id, userId: assignedUserId } });
      if (!membership) {
        return NextResponse.json({ success: false, error: "Secilen kullanici bu firmada kayitli degil." }, { status: 422 });
      }
    }
    updateData.assignedUserId = assignedUserId;
  }

  if (typeof body?.title === "string") {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json({ success: false, error: "Gorev basligi bos olamaz." }, { status: 422 });
    }
    updateData.title = title;
  }

  if (typeof body?.dueAt !== "undefined") {
    const dueAt = body.dueAt?.trim() ? new Date(body.dueAt) : null;
    if (body.dueAt?.trim() && Number.isNaN(dueAt?.getTime())) {
      return NextResponse.json({ success: false, error: "Termin tarihi gecersiz." }, { status: 422 });
    }
    updateData.dueAt = dueAt;
  }

  if (body?.status) {
    if (!taskStatuses.has(body.status)) {
      return NextResponse.json({ success: false, error: "Gorev durumu gecersiz." }, { status: 422 });
    }
    updateData.status = body.status;
  }

  if (body?.priority) {
    if (!taskPriorities.has(body.priority)) {
      return NextResponse.json({ success: false, error: "Gorev onceligi gecersiz." }, { status: 422 });
    }
    updateData.priority = body.priority;
  }

  if (typeof body?.note === "string") updateData.note = body.note.trim() || null;

  const updatedTask = await db.crmTask.update({ where: { id: task.id }, data: updateData });

  revalidatePath("/panel/crm");
  revalidatePath("/panel");

  return NextResponse.json({ success: true, data: updatedTask });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu islem icin giris yapmalisiniz." }, { status: 403 });
  }

  const { taskId } = await params;
  const task = await db.crmTask.findFirst({ where: { id: taskId, tenantId: context.tenant.id } });
  if (!task) {
    return NextResponse.json({ success: false, error: "Gorev bulunamadi." }, { status: 404 });
  }

  await db.crmTask.delete({ where: { id: task.id } });

  revalidatePath("/panel/crm");
  revalidatePath("/panel");

  return NextResponse.json({ success: true });
}


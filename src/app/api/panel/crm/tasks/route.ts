import { revalidatePath } from "next/cache";
import { CrmTaskPriority, CrmTaskStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

const taskStatuses = new Set<CrmTaskStatus>(["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"]);
const taskPriorities = new Set<CrmTaskPriority>(["LOW", "NORMAL", "HIGH"]);

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu islem icin giris yapmalisiniz." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        leadId?: string;
        assignedUserId?: string;
        title?: string;
        dueAt?: string;
        status?: CrmTaskStatus;
        priority?: CrmTaskPriority;
        note?: string;
      }
    | null;

  const title = body?.title?.trim() ?? "";
  if (!title) {
    return NextResponse.json({ success: false, error: "Gorev basligi zorunludur." }, { status: 422 });
  }

  const leadId = body?.leadId?.trim() || null;
  if (leadId) {
    const lead = await db.crmLead.findFirst({ where: { id: leadId, tenantId: context.tenant.id } });
    if (!lead) {
      return NextResponse.json({ success: false, error: "Bagli firsat bulunamadi." }, { status: 404 });
    }
  }

  const assignedUserId = body?.assignedUserId?.trim() || null;
  if (assignedUserId) {
    const membership = await db.membership.findFirst({ where: { tenantId: context.tenant.id, userId: assignedUserId } });
    if (!membership) {
      return NextResponse.json({ success: false, error: "Secilen kullanici bu firmada kayitli degil." }, { status: 422 });
    }
  }

  const dueAt = body?.dueAt?.trim() ? new Date(body.dueAt) : null;
  if (body?.dueAt?.trim() && Number.isNaN(dueAt?.getTime())) {
    return NextResponse.json({ success: false, error: "Termin tarihi gecersiz." }, { status: 422 });
  }

  const task = await db.crmTask.create({
    data: {
      tenantId: context.tenant.id,
      leadId,
      assignedUserId,
      title,
      dueAt,
      status: body?.status && taskStatuses.has(body.status) ? body.status : "OPEN",
      priority: body?.priority && taskPriorities.has(body.priority) ? body.priority : "NORMAL",
      note: body?.note?.trim() || null,
    },
  });

  revalidatePath("/panel/crm");
  revalidatePath("/panel");

  return NextResponse.json({ success: true, data: task });
}


import { ReminderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

type ReminderAction = "read" | "unread" | "done" | "reopen" | "cancel";

function buildUpdate(action: ReminderAction) {
  const now = new Date();

  switch (action) {
    case "read":
      return { isRead: true, readAt: now };
    case "unread":
      return { isRead: false, readAt: null };
    case "done":
      return { status: ReminderStatus.DONE, isRead: true, readAt: now };
    case "reopen":
      return { status: ReminderStatus.OPEN, isRead: false, readAt: null };
    case "cancel":
      return { status: ReminderStatus.CANCELLED, isRead: true, readAt: now };
    default:
      return null;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reminderId: string }> },
) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu islem icin giris yapmalisiniz." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { action?: ReminderAction } | null;
  const update = body?.action ? buildUpdate(body.action) : null;
  if (!update) {
    return NextResponse.json({ success: false, error: "Gecersiz hatirlatma aksiyonu." }, { status: 422 });
  }

  const { reminderId } = await params;
  const reminder = await db.reminder.findFirst({
    where: {
      id: reminderId,
      tenantId: context.tenant.id,
    },
    select: { id: true },
  });

  if (!reminder) {
    return NextResponse.json({ success: false, error: "Hatirlatma bulunamadi." }, { status: 404 });
  }

  const updated = await db.reminder.update({
    where: { id: reminderId },
    data: update,
    select: {
      id: true,
      title: true,
      message: true,
      dueAt: true,
      status: true,
      channel: true,
      isRead: true,
      readAt: true,
      relatedType: true,
      relatedId: true,
      createdAt: true,
    },
  });

  revalidatePath("/panel");
  revalidatePath("/panel/bildirimler");

  return NextResponse.json({
    success: true,
    data: {
      ...updated,
      dueAt: updated.dueAt.toISOString(),
      readAt: updated.readAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
    },
  });
}

import { ReminderChannel, ReminderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

function serializeReminder(reminder: {
  id: string;
  title: string;
  message: string | null;
  dueAt: Date;
  status: ReminderStatus;
  channel: ReminderChannel;
  isRead: boolean;
  readAt: Date | null;
  relatedType: string | null;
  relatedId: string | null;
  createdAt: Date;
}) {
  return {
    id: reminder.id,
    title: reminder.title,
    message: reminder.message,
    dueAt: reminder.dueAt.toISOString(),
    status: reminder.status,
    channel: reminder.channel,
    isRead: reminder.isRead,
    readAt: reminder.readAt?.toISOString() ?? null,
    relatedType: reminder.relatedType,
    relatedId: reminder.relatedId,
    createdAt: reminder.createdAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu islem icin giris yapmalisiniz." }, { status: 403 });
  }

  const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? "12");
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 30) : 12;
  const now = new Date();

  const [reminders, unreadCount, openCount, overdueCount] = await Promise.all([
    db.reminder.findMany({
      where: { tenantId: context.tenant.id },
      orderBy: [{ isRead: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
      take: limit,
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
    }),
    db.reminder.count({
      where: {
        tenantId: context.tenant.id,
        status: ReminderStatus.OPEN,
        isRead: false,
      },
    }),
    db.reminder.count({
      where: {
        tenantId: context.tenant.id,
        status: ReminderStatus.OPEN,
      },
    }),
    db.reminder.count({
      where: {
        tenantId: context.tenant.id,
        status: ReminderStatus.OPEN,
        dueAt: { lt: now },
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      unreadCount,
      openCount,
      overdueCount,
      reminders: reminders.map(serializeReminder),
    },
  });
}

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu islem icin giris yapmalisiniz." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        title?: string;
        message?: string;
        dueAt?: string;
        channel?: ReminderChannel;
        relatedType?: string | null;
        relatedId?: string | null;
      }
    | null;

  const title = body?.title?.trim() ?? "";
  if (!title) {
    return NextResponse.json({ success: false, error: "Hatirlatma basligi zorunludur." }, { status: 422 });
  }

  const dueAt = body?.dueAt ? new Date(body.dueAt) : null;
  if (!dueAt || Number.isNaN(dueAt.getTime())) {
    return NextResponse.json({ success: false, error: "Gecerli bir tarih secmelisiniz." }, { status: 422 });
  }

  const reminder = await db.reminder.create({
    data: {
      tenantId: context.tenant.id,
      title,
      message: body?.message?.trim() || null,
      dueAt,
      status: ReminderStatus.OPEN,
      channel: body?.channel ?? ReminderChannel.IN_APP,
      isRead: false,
      relatedType: body?.relatedType?.trim() || null,
      relatedId: body?.relatedId?.trim() || null,
    },
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

  return NextResponse.json({ success: true, data: serializeReminder(reminder) });
}

import { ReminderStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

export async function POST() {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu islem icin giris yapmalisiniz." }, { status: 403 });
  }

  const now = new Date();
  const result = await db.reminder.updateMany({
    where: {
      tenantId: context.tenant.id,
      status: ReminderStatus.OPEN,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: now,
    },
  });

  revalidatePath("/panel");
  revalidatePath("/panel/bildirimler");

  return NextResponse.json({
    success: true,
    data: {
      updatedCount: result.count,
      readAt: now.toISOString(),
    },
  });
}

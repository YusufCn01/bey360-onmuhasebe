import { ReminderChannel, ReminderStatus } from "@prisma/client";
import { db } from "@/lib/db";

export async function createReminder(input: {
  tenantId: string;
  title: string;
  dueAt: Date;
  message?: string | null;
  relatedType?: string | null;
  relatedId?: string | null;
  channel?: ReminderChannel;
}) {
  return db.reminder.create({
    data: {
      tenantId: input.tenantId,
      title: input.title,
      message: input.message?.trim() || null,
      dueAt: input.dueAt,
      status: ReminderStatus.OPEN,
      channel: input.channel ?? ReminderChannel.IN_APP,
      isRead: false,
      relatedType: input.relatedType?.trim() || null,
      relatedId: input.relatedId?.trim() || null,
    },
  });
}

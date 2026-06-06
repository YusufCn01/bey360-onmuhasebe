import "server-only";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { buildVerificationEmail } from "@/lib/email-templates";
import { sendMail } from "@/lib/mailer";

const VERIFY_TOKEN_TTL_HOURS = 24;

export async function createEmailVerificationToken(userId: string, email: string) {
  await db.emailVerificationToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + VERIFY_TOKEN_TTL_HOURS * 60 * 60 * 1000);

  return db.emailVerificationToken.create({
    data: {
      userId,
      email,
      token,
      expiresAt,
    },
  });
}

export async function sendVerificationEmail({
  userId,
  email,
  fullName,
}: {
  userId: string;
  email: string;
  fullName: string;
}) {
  const tokenRecord = await createEmailVerificationToken(userId, email);
  const appUrl = process.env.APP_URL || "http://127.0.0.1:3000";
  const verificationUrl = `${appUrl}/kayit/dogrula/${tokenRecord.token}`;
  const mail = buildVerificationEmail({ fullName, verificationUrl });
  const delivery = await sendMail({
    to: email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });

  return { tokenRecord, verificationUrl, delivery };
}

export async function getLatestEmailVerificationToken(email: string) {
  return db.emailVerificationToken.findFirst({
    where: { email, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });
}

export async function consumeEmailVerificationToken(token: string) {
  const record = await db.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    return { success: false as const, record: null };
  }

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    db.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { success: true as const, record };
}

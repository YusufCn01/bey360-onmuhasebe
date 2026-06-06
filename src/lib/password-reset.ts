import "server-only";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { buildPasswordResetEmail } from "@/lib/email-templates";
import { sendMail } from "@/lib/mailer";
import { hashPassword } from "@/lib/password";

const RESET_TOKEN_TTL_HOURS = 2;

export async function createPasswordResetToken(userId: string, email: string) {
  await db.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000);

  return db.passwordResetToken.create({
    data: {
      userId,
      email,
      token,
      expiresAt,
    },
  });
}

export async function sendPasswordResetEmail({
  userId,
  email,
  fullName,
}: {
  userId: string;
  email: string;
  fullName: string;
}) {
  const tokenRecord = await createPasswordResetToken(userId, email);
  const appUrl = process.env.APP_URL || "http://127.0.0.1:3000";
  const resetUrl = `${appUrl}/sifre-sifirla/${tokenRecord.token}`;
  const mail = buildPasswordResetEmail({ fullName, resetUrl });
  const delivery = await sendMail({
    to: email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });

  return { tokenRecord, resetUrl, delivery };
}

export async function getLatestPasswordResetToken(email: string) {
  return db.passwordResetToken.findFirst({
    where: { email, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });
}

export async function consumePasswordResetToken(token: string, password: string) {
  const record = await db.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    return { success: false as const, record: null };
  }

  const passwordHash = await hashPassword(password);

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    db.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { success: true as const, record };
}

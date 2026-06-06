import { redirect } from "next/navigation";
import { getCurrentUser, getSession, isSessionLocked } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getTenantContext() {
  const session = await getSession();
  if (!session) {
    redirect("/giris");
  }

  if (await isSessionLocked()) {
    redirect("/kilit");
  }

  if (session.globalRole === "FOUNDER") {
    redirect("/kurucu");
  }

  const user = await getCurrentUser();
  if (!user || !session.tenantId) {
    redirect("/giris");
  }

  const membership = user.memberships.find((item) => item.tenantId === session.tenantId) ?? user.memberships[0];
  if (!membership) {
    redirect("/giris");
  }

  const tenant = await db.tenant.findUnique({
    where: { id: membership.tenantId },
    include: { branches: true },
  });

  if (!tenant) {
    redirect("/giris");
  }

  if (!user.emailVerifiedAt && !user.email.endsWith(".local")) {
    redirect(`/kayit/dogrula?email=${encodeURIComponent(user.email)}`);
  }

  if (!tenant.onboardingCompletedAt && !user.email.endsWith(".local")) {
    redirect("/panel/onboarding");
  }

  return { session, user, membership, tenant };
}

export async function getTenantContextAllowIncomplete() {
  const session = await getSession();
  if (!session) {
    redirect("/giris");
  }

  if (await isSessionLocked()) {
    redirect("/kilit");
  }

  if (session.globalRole === "FOUNDER") {
    redirect("/kurucu");
  }

  const user = await getCurrentUser();
  if (!user || !session.tenantId) {
    redirect("/giris");
  }

  const membership = user.memberships.find((item) => item.tenantId === session.tenantId) ?? user.memberships[0];
  if (!membership) {
    redirect("/giris");
  }

  const tenant = await db.tenant.findUnique({
    where: { id: membership.tenantId },
    include: { branches: true },
  });

  if (!tenant) {
    redirect("/giris");
  }

  return { session, user, membership, tenant };
}

export async function getFounderContext() {
  const session = await getSession();
  if (!session) {
    redirect("/giris");
  }

  if (await isSessionLocked()) {
    redirect("/kilit");
  }

  if (session.globalRole !== "FOUNDER") {
    redirect("/panel");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/giris");
  }

  return { session, user };
}

export function canManageTenantUsers(role?: string | null) {
  return role === "OWNER" || role === "ADMIN";
}

import { getCurrentUser, getSession, isSessionLocked } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getRouteSessionContext() {
  if (await isSessionLocked()) {
    return null;
  }

  const session = await getSession();
  if (!session) {
    return null;
  }

  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  return { session, user };
}

export async function getFounderRouteContext() {
  const context = await getRouteSessionContext();
  if (!context || context.session.globalRole !== "FOUNDER") {
    return null;
  }
  return context;
}

export async function getTenantRouteContext() {
  const context = await getRouteSessionContext();
  if (!context || context.session.globalRole === "FOUNDER" || !context.session.tenantId) {
    return null;
  }

  const membership = context.user.memberships.find((item) => item.tenantId === context.session.tenantId) ?? context.user.memberships[0];
  if (!membership) {
    return null;
  }

  const tenant = await db.tenant.findUnique({ where: { id: membership.tenantId } });
  if (!tenant) {
    return null;
  }

  return { ...context, membership, tenant };
}

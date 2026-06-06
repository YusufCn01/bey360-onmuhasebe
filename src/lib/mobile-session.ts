import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

function readBearerToken(request: NextRequest) {
  const value = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!value) {
    return null;
  }

  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function getMobileTenantContext(request: NextRequest) {
  const token = readBearerToken(request);
  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);
  if (!session || session.globalRole === "FOUNDER" || !session.tenantId) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      memberships: {
        include: {
          branch: true,
          tenant: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const membership = user.memberships.find((item) => item.tenantId === session.tenantId) ?? user.memberships[0];
  if (!membership) {
    return null;
  }

  const tenant = membership.tenant ?? (await db.tenant.findUnique({ where: { id: membership.tenantId } }));
  if (!tenant) {
    return null;
  }

  return {
    session,
    user,
    membership,
    tenant,
  };
}

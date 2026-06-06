import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyPassword as comparePassword, hashPassword as createPasswordHash } from "@/lib/password";
import { LOCK_COOKIE, SESSION_COOKIE } from "@/lib/auth-config";

export type SessionPayload = {
  userId: string;
  tenantId?: string | null;
  membershipRole?: string | null;
  globalRole: "FOUNDER" | "USER";
};

function getSecret() {
  return new TextEncoder().encode(process.env.APP_SECRET || "bey360-finans-gizli-anahtar");
}

export async function hashPassword(password: string) {
  return createPasswordHash(password);
}

export async function verifyPassword(password: string, hash: string) {
  return comparePassword(password, hash);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const verified = await jwtVerify(token, getSecret());
    return verified.payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(LOCK_COOKIE);
}

export async function setLockCookie() {
  const store = await cookies();
  store.set(LOCK_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearLockCookie() {
  const store = await cookies();
  store.delete(LOCK_COOKIE);
}

export async function isSessionLocked() {
  const store = await cookies();
  return store.get(LOCK_COOKIE)?.value === "1";
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.userId) {
    return null;
  }

  return db.user.findUnique({
    where: { id: session.userId },
    include: {
      memberships: {
        include: {
          tenant: true,
          branch: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function requireAppSession() {
  return getSession();
}

export async function requireFounderSession() {
  const session = await getSession();
  if (!session || session.globalRole !== "FOUNDER") {
    return null;
  }
  return session;
}

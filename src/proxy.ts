import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { LOCK_COOKIE, SESSION_COOKIE } from "@/lib/auth-config";

async function readSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.APP_SECRET || "bey360-finans-gizli-anahtar");
    const result = await jwtVerify(token, secret);
    return result.payload as { globalRole?: string };
  } catch {
    return null;
  }
}

function redirectTargetForSession(session: { globalRole?: string } | null) {
  return session?.globalRole === "FOUNDER" ? "/kurucu" : "/panel";
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isLocked = request.cookies.get(LOCK_COOKIE)?.value === "1";
  const isProtectedPath = pathname.startsWith("/panel") || pathname.startsWith("/kurucu");
  const isLockPath = pathname.startsWith("/kilit");

  if (!isProtectedPath && !isLockPath) {
    return NextResponse.next();
  }

  const session = await readSession(request);
  if (!session) {
    return NextResponse.redirect(new URL("/giris", request.url));
  }

  if (isLockPath) {
    if (!isLocked) {
      return NextResponse.redirect(new URL(redirectTargetForSession(session), request.url));
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/kurucu") && session.globalRole !== "FOUNDER") {
    return NextResponse.redirect(new URL("/panel", request.url));
  }

  if (isLocked) {
    const lockUrl = new URL("/kilit", request.url);
    lockUrl.searchParams.set("returnTo", `${pathname}${search}`);
    return NextResponse.redirect(lockUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*", "/kurucu/:path*", "/kilit"],
};

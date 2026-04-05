import { NextResponse } from "next/server";
import { clearLockCookie, clearSessionCookie } from "@/lib/auth";

export async function POST() {
  await clearLockCookie();
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}

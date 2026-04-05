import { NextResponse } from "next/server";
import { getSession, setLockCookie } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Oturum bulunamadi." }, { status: 403 });
  }

  await setLockCookie();
  return NextResponse.json({ success: true });
}

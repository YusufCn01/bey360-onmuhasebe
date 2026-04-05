import { NextResponse } from "next/server";
import { getCurrentUser, getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  const user = await getCurrentUser();

  return NextResponse.json({
    success: true,
    data: {
      session,
      user,
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { name?: string; balance?: string } | null;
  const name = body?.name?.trim() ?? "";

  if (!name) {
    return NextResponse.json({ success: false, error: "Kasa adı zorunludur." }, { status: 422 });
  }

  const account = await db.cashAccount.create({
    data: {
      tenantId: context.tenant.id,
      name,
      balance: Number(body?.balance ?? 0),
    },
  });

  revalidatePath("/panel/finans");
  revalidatePath("/panel");
  return NextResponse.json({ success: true, data: account });
}

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { title?: string; category?: string; amount?: string; note?: string } | null;
  const title = body?.title?.trim() ?? "";
  const category = body?.category?.trim() ?? "Genel Gider";
  const amount = Number(body?.amount ?? 0);

  if (!title || amount <= 0) {
    return NextResponse.json({ success: false, error: "Gider adı ve tutarı zorunludur." }, { status: 422 });
  }

  const expense = await db.expenseRecord.create({
    data: {
      tenantId: context.tenant.id,
      title,
      category,
      amount,
      note: body?.note?.trim() || null,
    },
  });

  revalidatePath("/panel/finans");
  revalidatePath("/panel");
  return NextResponse.json({ success: true, data: expense });
}

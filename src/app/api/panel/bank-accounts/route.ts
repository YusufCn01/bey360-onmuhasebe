import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { bankName?: string; iban?: string; balance?: string } | null;
  const bankName = body?.bankName?.trim() ?? "";
  const iban = body?.iban?.trim() ?? "";

  if (!bankName || !iban) {
    return NextResponse.json({ success: false, error: "Banka adı ve IBAN zorunludur." }, { status: 422 });
  }

  const account = await db.bankAccount.create({
    data: {
      tenantId: context.tenant.id,
      bankName,
      iban,
      balance: Number(body?.balance ?? 0),
    },
  });

  revalidatePath("/panel/finans");
  revalidatePath("/panel");
  return NextResponse.json({ success: true, data: account });
}

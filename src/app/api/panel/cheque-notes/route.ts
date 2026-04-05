import { ChequeNoteDirection, ChequeNoteStatus, ChequeNoteType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createReminder } from "@/lib/reminders";
import { getTenantRouteContext } from "@/lib/session-context";

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        type?: ChequeNoteType;
        direction?: ChequeNoteDirection;
        referenceNo?: string;
        customerId?: string | null;
        supplierId?: string | null;
        amount?: string | number;
        dueDate?: string;
        issueDate?: string;
        bankName?: string;
        branchName?: string;
        accountNo?: string;
        ownerName?: string;
        note?: string;
      }
    | null;

  const referenceNo = body?.referenceNo?.trim() ?? "";
  if (!referenceNo) {
    return NextResponse.json({ success: false, error: "Referans numarası zorunludur." }, { status: 422 });
  }

  const amount = Number(body?.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ success: false, error: "Tutar sıfırdan büyük olmalıdır." }, { status: 422 });
  }

  const dueDate = body?.dueDate ? new Date(body.dueDate) : null;
  const issueDate = body?.issueDate ? new Date(body.issueDate) : new Date();

  const chequeNote = await db.chequeNote.create({
    data: {
      tenantId: context.tenant.id,
      type: body?.type ?? ChequeNoteType.CHEQUE,
      direction: body?.direction ?? ChequeNoteDirection.RECEIVED,
      status: ChequeNoteStatus.PORTFOLIO,
      referenceNo,
      customerId: body?.customerId?.trim() || null,
      supplierId: body?.supplierId?.trim() || null,
      amount,
      dueDate,
      issueDate,
      bankName: body?.bankName?.trim() || null,
      branchName: body?.branchName?.trim() || null,
      accountNo: body?.accountNo?.trim() || null,
      ownerName: body?.ownerName?.trim() || null,
      note: body?.note?.trim() || null,
    },
  });

  if (dueDate && !Number.isNaN(dueDate.getTime())) {
    const partyName = body?.direction === ChequeNoteDirection.ISSUED ? "odeme cikisi" : "tahsilat girisi";
    await createReminder({
      tenantId: context.tenant.id,
      title: `${referenceNo} vadeli cek / senet yaklasiyor`,
      dueAt: dueDate,
      message: `${referenceNo} referansli ${partyName} icin vade tarihi geldi. Tutar: ${amount.toLocaleString("tr-TR", {
        style: "currency",
        currency: "TRY",
      })}`,
      relatedType: "CHEQUE_NOTE",
      relatedId: chequeNote.id,
    });
  }

  revalidatePath("/panel/cek-senet");
  revalidatePath("/panel");
  revalidatePath("/panel/bildirimler");

  return NextResponse.json({ success: true, data: chequeNote });
}

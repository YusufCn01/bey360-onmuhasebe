import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createInvoiceFromDispatchNote } from "@/lib/business/documents";
import { getTenantRouteContext } from "@/lib/session-context";

export async function POST(_: Request, { params }: { params: Promise<{ dispatchNoteId: string }> }) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const { dispatchNoteId } = await params;

  try {
    const invoice = await createInvoiceFromDispatchNote(dispatchNoteId, context.tenant.id, context.membership.branchId);
    revalidatePath("/panel/irsaliyeler");
    revalidatePath("/panel/satis-faturalari");
    revalidatePath("/panel/faturalar");
    revalidatePath("/panel/cari");
    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    const message = error instanceof Error ? error.message : "İrsaliye faturaya dönüştürülemedi.";
    return NextResponse.json({ success: false, error: message }, { status: 422 });
  }
}

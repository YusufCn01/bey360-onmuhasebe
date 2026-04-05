import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createInvoiceFromOrder } from "@/lib/business/documents";
import { getTenantRouteContext } from "@/lib/session-context";

export async function POST(_: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const { orderId } = await params;

  try {
    const invoice = await createInvoiceFromOrder(orderId, context.tenant.id, context.membership.branchId);
    revalidatePath("/panel/teklif-siparis");
    revalidatePath("/panel/faturalar");
    revalidatePath("/panel/cari");
    revalidatePath("/panel");
    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sipariş faturaya dönüştürülemedi.";
    return NextResponse.json({ success: false, error: message }, { status: 422 });
  }
}

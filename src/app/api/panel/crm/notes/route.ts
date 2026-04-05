import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu islem icin giris yapmalisiniz." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { leadId?: string; content?: string } | null;
  const leadId = body?.leadId?.trim() ?? "";
  const content = body?.content?.trim() ?? "";

  if (!leadId || !content) {
    return NextResponse.json({ success: false, error: "Not icin firsat ve icerik zorunludur." }, { status: 422 });
  }

  const lead = await db.crmLead.findFirst({ where: { id: leadId, tenantId: context.tenant.id } });
  if (!lead) {
    return NextResponse.json({ success: false, error: "Not eklenecek firsat bulunamadi." }, { status: 404 });
  }

  const note = await db.crmLeadNote.create({
    data: {
      tenantId: context.tenant.id,
      leadId: lead.id,
      userId: context.user.id,
      content,
    },
  });

  revalidatePath("/panel/crm");

  return NextResponse.json({ success: true, data: note });
}


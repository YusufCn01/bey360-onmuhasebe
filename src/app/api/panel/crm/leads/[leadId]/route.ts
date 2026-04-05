import { revalidatePath } from "next/cache";
import { CrmLeadStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

const leadStatuses = new Set<CrmLeadStatus>(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> },
) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu islem icin giris yapmalisiniz." }, { status: 403 });
  }

  const { leadId } = await params;
  const lead = await db.crmLead.findFirst({ where: { id: leadId, tenantId: context.tenant.id } });
  if (!lead) {
    return NextResponse.json({ success: false, error: "Firsat bulunamadi." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        title?: string;
        customerId?: string | null;
        ownerUserId?: string | null;
        source?: string;
        contactName?: string;
        contactEmail?: string;
        contactPhone?: string;
        status?: CrmLeadStatus;
        expectedValue?: string | number;
        probability?: string | number;
        nextActionAt?: string | null;
        summary?: string;
      }
    | null;

  const updateData: {
    title?: string;
    customerId?: string | null;
    ownerUserId?: string | null;
    source?: string | null;
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    status?: CrmLeadStatus;
    expectedValue?: number;
    probability?: number;
    nextActionAt?: Date | null;
    summary?: string | null;
  } = {};

  if (typeof body?.title === "string") {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json({ success: false, error: "Firsat basligi bos olamaz." }, { status: 422 });
    }
    updateData.title = title;
  }

  if (typeof body?.customerId !== "undefined") {
    const customerId = body.customerId?.trim() || null;
    if (customerId) {
      const customer = await db.customer.findFirst({ where: { id: customerId, tenantId: context.tenant.id } });
      if (!customer) {
        return NextResponse.json({ success: false, error: "Secilen musteri bulunamadi." }, { status: 404 });
      }
    }
    updateData.customerId = customerId;
  }

  if (typeof body?.ownerUserId !== "undefined") {
    const ownerUserId = body.ownerUserId?.trim() || null;
    if (ownerUserId) {
      const membership = await db.membership.findFirst({ where: { tenantId: context.tenant.id, userId: ownerUserId } });
      if (!membership) {
        return NextResponse.json({ success: false, error: "Secilen sorumlu bu firmada kayitli degil." }, { status: 422 });
      }
    }
    updateData.ownerUserId = ownerUserId;
  }

  if (body?.status) {
    if (!leadStatuses.has(body.status)) {
      return NextResponse.json({ success: false, error: "Firsat durumu gecersiz." }, { status: 422 });
    }
    updateData.status = body.status;
  }

  if (typeof body?.expectedValue !== "undefined") {
    const expectedValue = Number(body.expectedValue);
    if (!Number.isFinite(expectedValue) || expectedValue < 0) {
      return NextResponse.json({ success: false, error: "Beklenen tutar gecersiz." }, { status: 422 });
    }
    updateData.expectedValue = expectedValue;
  }

  if (typeof body?.probability !== "undefined") {
    const probability = Number(body.probability);
    if (!Number.isFinite(probability) || probability < 0 || probability > 100) {
      return NextResponse.json({ success: false, error: "Olasilik 0 ile 100 arasinda olmalidir." }, { status: 422 });
    }
    updateData.probability = Math.round(probability);
  }

  if (typeof body?.nextActionAt !== "undefined") {
    const nextActionAt = body.nextActionAt?.trim() ? new Date(body.nextActionAt) : null;
    if (body.nextActionAt?.trim() && Number.isNaN(nextActionAt?.getTime())) {
      return NextResponse.json({ success: false, error: "Sonraki aksiyon tarihi gecersiz." }, { status: 422 });
    }
    updateData.nextActionAt = nextActionAt;
  }

  if (typeof body?.source === "string") updateData.source = body.source.trim() || null;
  if (typeof body?.contactName === "string") updateData.contactName = body.contactName.trim() || null;
  if (typeof body?.contactEmail === "string") updateData.contactEmail = body.contactEmail.trim() || null;
  if (typeof body?.contactPhone === "string") updateData.contactPhone = body.contactPhone.trim() || null;
  if (typeof body?.summary === "string") updateData.summary = body.summary.trim() || null;

  const updatedLead = await db.crmLead.update({ where: { id: lead.id }, data: updateData });

  revalidatePath("/panel/crm");
  revalidatePath("/panel");

  return NextResponse.json({ success: true, data: updatedLead });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> },
) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu islem icin giris yapmalisiniz." }, { status: 403 });
  }

  const { leadId } = await params;
  const lead = await db.crmLead.findFirst({ where: { id: leadId, tenantId: context.tenant.id } });
  if (!lead) {
    return NextResponse.json({ success: false, error: "Firsat bulunamadi." }, { status: 404 });
  }

  await db.crmLead.delete({ where: { id: lead.id } });

  revalidatePath("/panel/crm");
  revalidatePath("/panel");

  return NextResponse.json({ success: true });
}


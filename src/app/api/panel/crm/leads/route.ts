import { revalidatePath } from "next/cache";
import { CrmLeadStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

const leadStatuses = new Set<CrmLeadStatus>(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]);

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu islem icin giris yapmalisiniz." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        title?: string;
        customerId?: string;
        ownerUserId?: string;
        source?: string;
        contactName?: string;
        contactEmail?: string;
        contactPhone?: string;
        status?: CrmLeadStatus;
        expectedValue?: string | number;
        probability?: string | number;
        nextActionAt?: string;
        summary?: string;
      }
    | null;

  const title = body?.title?.trim() ?? "";
  if (!title) {
    return NextResponse.json({ success: false, error: "Firsat basligi zorunludur." }, { status: 422 });
  }

  const customerId = body?.customerId?.trim() || null;
  if (customerId) {
    const customer = await db.customer.findFirst({ where: { id: customerId, tenantId: context.tenant.id } });
    if (!customer) {
      return NextResponse.json({ success: false, error: "Secilen musteri bulunamadi." }, { status: 404 });
    }
  }

  const ownerUserId = body?.ownerUserId?.trim() || null;
  if (ownerUserId) {
    const membership = await db.membership.findFirst({ where: { tenantId: context.tenant.id, userId: ownerUserId } });
    if (!membership) {
      return NextResponse.json({ success: false, error: "Secilen sorumlu bu firmada kayitli degil." }, { status: 422 });
    }
  }

  const probability = Number(body?.probability ?? 20);
  const expectedValue = Number(body?.expectedValue ?? 0);
  if (!Number.isFinite(probability) || probability < 0 || probability > 100) {
    return NextResponse.json({ success: false, error: "Olasilik 0 ile 100 arasinda olmalidir." }, { status: 422 });
  }
  if (!Number.isFinite(expectedValue) || expectedValue < 0) {
    return NextResponse.json({ success: false, error: "Beklenen tutar negatif olamaz." }, { status: 422 });
  }

  const nextActionAt = body?.nextActionAt?.trim() ? new Date(body.nextActionAt) : null;
  if (body?.nextActionAt?.trim() && Number.isNaN(nextActionAt?.getTime())) {
    return NextResponse.json({ success: false, error: "Sonraki aksiyon tarihi gecerli degil." }, { status: 422 });
  }

  const lead = await db.crmLead.create({
    data: {
      tenantId: context.tenant.id,
      title,
      customerId,
      ownerUserId,
      source: body?.source?.trim() || null,
      contactName: body?.contactName?.trim() || null,
      contactEmail: body?.contactEmail?.trim() || null,
      contactPhone: body?.contactPhone?.trim() || null,
      status: body?.status && leadStatuses.has(body.status) ? body.status : "NEW",
      expectedValue,
      probability: Math.round(probability),
      nextActionAt,
      summary: body?.summary?.trim() || null,
    },
  });

  revalidatePath("/panel/crm");
  revalidatePath("/panel");

  return NextResponse.json({ success: true, data: lead });
}


import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | {
        companyName?: string;
        contactName?: string;
        email?: string;
        phone?: string;
        city?: string;
        note?: string;
      }
    | null;

  if (!body?.companyName || !body.contactName || !body.email || !body.phone) {
    return NextResponse.json({ success: false, error: { message: "Zorunlu bayi başvuru alanları eksik." } }, { status: 422 });
  }

  const application = await db.dealerApplication.create({
    data: {
      companyName: body.companyName.trim(),
      contactName: body.contactName.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone.trim(),
      city: body.city?.trim() || null,
      note: body.note?.trim() || null,
    },
  });

  return NextResponse.json({ success: true, data: application });
}

import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getFounderRouteContext } from "@/lib/session-context";

function normalizeCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
}

export async function GET() {
  const context = await getFounderRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: { message: "Bu işlem için kurucu oturumu gerekli." } }, { status: 403 });
  }

  const plans = await db.packagePlan.findMany({
    orderBy: [{ isActive: "desc" }, { monthlyPrice: "asc" }],
    include: { _count: { select: { tenants: true, applications: true } } },
  });

  return NextResponse.json({ success: true, data: plans });
}

export async function POST(request: NextRequest) {
  const context = await getFounderRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: { message: "Bu işlem için kurucu oturumu gerekli." } }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        code?: string;
        name?: string;
        monthlyPrice?: number | string;
        yearlyPrice?: number | string;
        userLimit?: number | string;
        branchLimit?: number | string;
        isActive?: boolean;
      }
    | null;

  const name = body?.name?.trim() || "";
  const code = normalizeCode(body?.code?.trim() || name);
  const monthlyPrice = Number(body?.monthlyPrice ?? 0);
  const yearlyPrice = Number(body?.yearlyPrice ?? 0);
  const userLimit = Number(body?.userLimit ?? 1);
  const branchLimit = Number(body?.branchLimit ?? 1);

  if (!name || !code) {
    return NextResponse.json({ success: false, error: { message: "Paket adı ve kodu zorunludur." } }, { status: 422 });
  }

  if (![monthlyPrice, yearlyPrice, userLimit, branchLimit].every(Number.isFinite) || monthlyPrice < 0 || yearlyPrice < 0 || userLimit < 1 || branchLimit < 1) {
    return NextResponse.json({ success: false, error: { message: "Paket sayısal alanları geçerli olmalıdır." } }, { status: 422 });
  }

  const existing = await db.packagePlan.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ success: false, error: { message: "Bu paket kodu zaten kullanılıyor." } }, { status: 409 });
  }

  const plan = await db.packagePlan.create({
    data: {
      code,
      name,
      monthlyPrice,
      yearlyPrice,
      userLimit,
      branchLimit,
      isActive: body?.isActive ?? true,
    },
  });

  revalidatePath("/kurucu");
  revalidatePath("/kurucu/paketler");
  revalidatePath("/kurucu/tenantlar");
  revalidatePath("/kurucu/bayi-basvurulari");

  return NextResponse.json({ success: true, data: plan });
}

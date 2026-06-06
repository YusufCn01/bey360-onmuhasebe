import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

type OnboardingPayload = {
  mode?: "draft" | "complete";
  currentStep?: number;
  name?: string;
  taxNumber?: string;
  phone?: string;
  email?: string;
  city?: string;
  district?: string;
  address?: string;
  logoUrl?: string;
  secondaryLogoUrl?: string;
  signatureImageUrl?: string;
  stampImageUrl?: string;
  signatureName?: string;
  signatureTitle?: string;
  createCustomer?: boolean;
  createProduct?: boolean;
  customerName?: string;
  customerEmail?: string;
  productName?: string;
  productPrice?: string;
};

function normalizePayload(body: OnboardingPayload | null, fallbackName: string) {
  const currentStep = Number.isFinite(body?.currentStep) ? Math.max(0, Number(body?.currentStep ?? 0)) : 0;

  return {
    currentStep,
    name: body?.name?.trim() || fallbackName,
    taxNumber: body?.taxNumber?.trim() || "",
    phone: body?.phone?.trim() || "",
    email: body?.email?.trim() || "",
    city: body?.city?.trim() || "",
    district: body?.district?.trim() || "",
    address: body?.address?.trim() || "",
    logoUrl: body?.logoUrl?.trim() || "",
    secondaryLogoUrl: body?.secondaryLogoUrl?.trim() || "",
    signatureImageUrl: body?.signatureImageUrl?.trim() || "",
    stampImageUrl: body?.stampImageUrl?.trim() || "",
    signatureName: body?.signatureName?.trim() || "",
    signatureTitle: body?.signatureTitle?.trim() || "",
    createCustomer: Boolean(body?.createCustomer),
    createProduct: Boolean(body?.createProduct),
    customerName: body?.customerName?.trim() || "",
    customerEmail: body?.customerEmail?.trim() || "",
    productName: body?.productName?.trim() || "",
    productPrice: body?.productPrice?.trim() || "",
  };
}

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Oturum bulunamadı." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as OnboardingPayload | null;
  const mode = body?.mode === "complete" ? "complete" : "draft";
  const payload = normalizePayload(body, context.tenant.name || "");

  if (mode === "complete" && !payload.name) {
    return NextResponse.json({ success: false, error: "Firma adı zorunludur." }, { status: 422 });
  }

  if (mode === "draft") {
    await db.tenant.update({
      where: { id: context.tenant.id },
      data: {
        name: payload.name,
        taxNumber: payload.taxNumber || null,
        phone: payload.phone || null,
        email: payload.email || null,
        city: payload.city || null,
        district: payload.district || null,
        address: payload.address || null,
        logoUrl: payload.logoUrl || null,
        secondaryLogoUrl: payload.secondaryLogoUrl || null,
        signatureImageUrl: payload.signatureImageUrl || null,
        stampImageUrl: payload.stampImageUrl || null,
        signatureName: payload.signatureName || null,
        signatureTitle: payload.signatureTitle || null,
        onboardingDraftJson: JSON.stringify(payload),
        onboardingCurrentStep: payload.currentStep,
      },
    });

    return NextResponse.json({ success: true, mode: "draft" });
  }

  const [customerCount, productCount] = await Promise.all([
    db.customer.count({ where: { tenantId: context.tenant.id } }),
    db.product.count({ where: { tenantId: context.tenant.id } }),
  ]);

  await db.$transaction(async (tx) => {
    await tx.tenant.update({
      where: { id: context.tenant.id },
      data: {
        name: payload.name,
        taxNumber: payload.taxNumber || null,
        phone: payload.phone || null,
        email: payload.email || null,
        city: payload.city || null,
        district: payload.district || null,
        address: payload.address || null,
        logoUrl: payload.logoUrl || null,
        secondaryLogoUrl: payload.secondaryLogoUrl || null,
        signatureImageUrl: payload.signatureImageUrl || null,
        stampImageUrl: payload.stampImageUrl || null,
        signatureName: payload.signatureName || null,
        signatureTitle: payload.signatureTitle || null,
        onboardingCompletedAt: new Date(),
        onboardingDraftJson: null,
        onboardingCurrentStep: 0,
      },
    });

    if (payload.createCustomer && payload.customerName) {
      await tx.customer.create({
        data: {
          tenantId: context.tenant.id,
          code: `CR${String(customerCount + 1).padStart(4, "0")}`,
          name: payload.customerName,
          email: payload.customerEmail || null,
          city: payload.city || null,
        },
      });
    }

    if (payload.createProduct && payload.productName) {
      const price = Number(payload.productPrice || 0);
      await tx.product.create({
        data: {
          tenantId: context.tenant.id,
          code: `UR${String(productCount + 1).padStart(4, "0")}`,
          name: payload.productName,
          salePrice: price,
          purchasePrice: price,
        },
      });
    }
  });

  return NextResponse.json({ success: true, mode: "complete" });
}

import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { type CustomerExcelFormat, normalizeCustomerExcelFormat, parseCustomerWorkbook } from "@/lib/customer-excel";
import { buildCustomerDisplayName, buildCustomerWriteData, normalizeCustomerType } from "@/lib/customer-utils";
import { db } from "@/lib/db";
import { getTenantRouteContext } from "@/lib/session-context";

const codePrefixMap: Record<CustomerExcelFormat, string> = {
  logo: "CR",
  "hizli-bilisim": "HZL",
};

function buildGeneratedCustomerCode(existingCodes: Set<string>, format: CustomerExcelFormat) {
  const prefix = codePrefixMap[format];
  let index = 1;

  while (true) {
    const code = `${prefix}-${String(index).padStart(5, "0")}`;
    if (!existingCodes.has(code)) {
      existingCodes.add(code);
      return code;
    }

    index += 1;
  }
}

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  const formData = (await request.formData().catch(() => null)) as globalThis.FormData | null;
  const file = formData?.get("file");
  const format = normalizeCustomerExcelFormat(String(formData?.get("format") ?? ""));

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: "Excel dosyası yüklenmedi." }, { status: 422 });
  }

  const rows = parseCustomerWorkbook(await file.arrayBuffer(), format);
  if (rows.length === 0) {
    return NextResponse.json({ success: false, error: "Excel dosyasında aktarılacak kayıt bulunamadı." }, { status: 422 });
  }

  const existingCustomers = await db.customer.findMany({
    where: { tenantId: context.tenant.id },
    select: { id: true, code: true },
  });
  const existingCodes = new Set(existingCustomers.map((customer) => customer.code));

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const payload = {
      ...row,
      code: row.code?.trim() || buildGeneratedCustomerCode(existingCodes, format),
    };

    const code = payload.code;
    const type = normalizeCustomerType(payload.type);
    const name = buildCustomerDisplayName(payload, type);

    if (!code || !name) {
      skipped += 1;
      continue;
    }

    const existing = existingCustomers.find((customer) => customer.code === code);
    const data = {
      ...buildCustomerWriteData(payload),
      tenantId: context.tenant.id,
      code,
      type,
      name,
    };

    if (existing) {
      await db.customer.update({
        where: { id: existing.id },
        data,
      });
      updated += 1;
      continue;
    }

    const created = await db.customer.create({ data });
    existingCustomers.push({ id: created.id, code: created.code });
    imported += 1;
  }

  revalidatePath("/panel/cari");
  revalidatePath("/panel/cari/musteriler");
  revalidatePath("/panel/cari/tedarikciler");
  revalidatePath("/panel");

  return NextResponse.json({
    success: true,
    data: {
      imported,
      updated,
      skipped,
      total: rows.length,
      format,
    },
  });
}

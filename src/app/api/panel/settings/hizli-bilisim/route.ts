import { EInvoiceProvider } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { encryptHizliCredentials } from "@/lib/integrations/hizli-bilisim";
import { getTenantRouteContext } from "@/lib/session-context";

export async function POST(request: NextRequest) {
  const context = await getTenantRouteContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Bu işlem için giriş yapmalısınız." }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => null)) as
      | {
          serviceUsername?: string;
          servicePassword?: string;
          serviceCompanyCode?: string;
          serviceEndpoint?: string;
          serviceCreditCount?: string | number;
          serviceMeslekMensubuKey?: string;
        }
      | null;

    const current = await db.eInvoiceSettings.findUnique({ where: { tenantId: context.tenant.id } });
    const envSecretKey = process.env.HIZLI_BILISIM_SECRET_KEY?.trim() || null;
    const envApiKey = process.env.HIZLI_BILISIM_API_KEY?.trim() || null;
    const secretKey = current?.serviceSecretKey || envSecretKey || null;
    const apiKey = current?.serviceApiKey || envApiKey || null;
    const endpoint = body?.serviceEndpoint?.trim() || current?.serviceEndpoint || "";
    const meslekKey = body?.serviceMeslekMensubuKey?.trim() || current?.serviceMeslekMensubuKey || null;
    const plainUsername = body?.serviceUsername?.trim() || "";
    const plainPassword = body?.servicePassword?.trim() || "";

    let encryptedUsername = current?.serviceUsername ?? null;
    let encryptedPassword = current?.servicePassword ?? null;

    if ((plainUsername || plainPassword) && !secretKey) {
      return NextResponse.json({ success: false, error: "Developer tarafından tanımlı Secret Key bulunamadı." }, { status: 422 });
    }

    if (plainUsername || plainPassword) {
      if (!plainUsername || !plainPassword) {
        return NextResponse.json({ success: false, error: "Yeni kullanıcı bilgisi girilecekse kullanıcı adı ve parola birlikte girilmelidir." }, { status: 422 });
      }

      const encrypted = await encryptHizliCredentials({
        secretKey: secretKey!,
        username: plainUsername,
        password: plainPassword,
        endpoint,
      });

      encryptedUsername = encrypted.username;
      encryptedPassword = encrypted.password;
    }

    const parsedCreditCount =
      typeof body?.serviceCreditCount === "number"
        ? body.serviceCreditCount
        : typeof body?.serviceCreditCount === "string" && body.serviceCreditCount.trim().length > 0
          ? Number(body.serviceCreditCount)
          : current?.serviceCreditCount ?? null;

    const settings = await db.eInvoiceSettings.upsert({
      where: { tenantId: context.tenant.id },
      update: {
        provider: EInvoiceProvider.HIZLI_BILISIM,
        serviceSecretKey: secretKey,
        serviceApiKey: apiKey,
        serviceUsername: encryptedUsername,
        servicePassword: encryptedPassword,
        serviceCompanyCode: body?.serviceCompanyCode?.trim() || current?.serviceCompanyCode || null,
        serviceEndpoint: endpoint || null,
        serviceMeslekMensubuKey: meslekKey,
        serviceCreditCount: typeof parsedCreditCount === "number" && Number.isFinite(parsedCreditCount) ? Math.max(0, Math.floor(parsedCreditCount)) : null,
        serviceCreditUpdatedAt: new Date(),
      },
      create: {
        tenantId: context.tenant.id,
        provider: EInvoiceProvider.HIZLI_BILISIM,
        serviceSecretKey: secretKey,
        serviceApiKey: apiKey,
        serviceUsername: encryptedUsername,
        servicePassword: encryptedPassword,
        serviceCompanyCode: body?.serviceCompanyCode?.trim() || null,
        serviceEndpoint: endpoint || null,
        serviceMeslekMensubuKey: meslekKey,
        serviceCreditCount: typeof parsedCreditCount === "number" && Number.isFinite(parsedCreditCount) ? Math.max(0, Math.floor(parsedCreditCount)) : null,
        serviceCreditUpdatedAt: new Date(),
      },
    });

    revalidatePath("/panel/ayarlar/hizli-bilisim");
    revalidatePath("/panel/ayarlar/e-fatura");
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Hızlı Bilişim ayarları kaydedilemedi.";
    const message =
      rawMessage.toLocaleLowerCase("tr-TR").includes("secret key") || rawMessage.toLocaleLowerCase("tr-TR").includes("hatalı secret key")
        ? "SecretKey doğrulanamadı. Test endpoint için test key, canlı endpoint için Hızlı Bilişim tarafından verilen gerçek canlı key kullanılmalıdır."
        : rawMessage;
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}

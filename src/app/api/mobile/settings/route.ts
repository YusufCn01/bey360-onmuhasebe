import { EInvoiceProvider } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encryptHizliCredentials } from "@/lib/integrations/hizli-bilisim";
import { getMobileTenantContext } from "@/lib/mobile-session";

function buildSettingsPayload(settings: {
  provider?: string | null;
  serviceCompanyCode?: string | null;
  serviceEndpoint?: string | null;
  serviceMeslekMensubuKey?: string | null;
  serviceUsername?: string | null;
  servicePassword?: string | null;
  serviceSecretKey?: string | null;
  serviceApiKey?: string | null;
  gibAlias?: string | null;
}) {
  const endpoint = settings.serviceEndpoint?.trim() || "";
  const isTestEndpoint = endpoint.toLocaleLowerCase("tr-TR").includes("econnecttest");
  const isLiveEndpoint = endpoint.toLocaleLowerCase("tr-TR").includes("econnect.hizliteknoloji.com.tr") && !isTestEndpoint;

  return {
    provider: settings.provider ?? "HIZLI_BILISIM",
    environment: isLiveEndpoint ? "Canlı" : isTestEndpoint ? "Test" : "Belirsiz",
    serviceUsername: "",
    servicePassword: "",
    serviceCompanyCode: settings.serviceCompanyCode ?? "",
    serviceEndpoint: endpoint,
    serviceMeslekMensubuKey: "",
    hasEncryptedCredentials: Boolean(settings.serviceUsername && settings.servicePassword),
    hasDeveloperKeys:
      Boolean(settings.serviceSecretKey && settings.serviceApiKey) ||
      Boolean(process.env.HIZLI_BILISIM_SECRET_KEY && process.env.HIZLI_BILISIM_API_KEY) ||
      false,
    hasMeslekMensubuKey: Boolean(settings.serviceMeslekMensubuKey),
    senderAlias: settings.gibAlias ?? null,
  };
}

export async function GET(request: NextRequest) {
  const context = await getMobileTenantContext(request);
  if (!context) {
    return NextResponse.json({ success: false, error: { message: "Mobil oturum geçersiz." } }, { status: 401 });
  }

  const settings = await db.eInvoiceSettings.findUnique({
    where: { tenantId: context.tenant.id },
    select: {
      provider: true,
      serviceCompanyCode: true,
      serviceEndpoint: true,
      serviceMeslekMensubuKey: true,
      serviceUsername: true,
      servicePassword: true,
      serviceSecretKey: true,
      serviceApiKey: true,
      gibAlias: true,
    },
  });

  return NextResponse.json({
    success: true,
    data: buildSettingsPayload(settings ?? {}),
  });
}

export async function POST(request: NextRequest) {
  const context = await getMobileTenantContext(request);
  if (!context) {
    return NextResponse.json({ success: false, error: { message: "Mobil oturum geçersiz." } }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => null)) as
      | {
          serviceUsername?: string;
          servicePassword?: string;
          serviceCompanyCode?: string;
          serviceEndpoint?: string;
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
      return NextResponse.json({ success: false, error: { message: "Developer tarafından tanımlı Secret Key bulunamadı." } }, { status: 422 });
    }

    if (plainUsername || plainPassword) {
      if (!plainUsername || !plainPassword) {
        return NextResponse.json(
          { success: false, error: { message: "Yeni kullanıcı bilgisi girilecekse kullanıcı adı ve parola birlikte girilmelidir." } },
          { status: 422 },
        );
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
      },
    });

    return NextResponse.json({
      success: true,
      data: buildSettingsPayload(settings),
    });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Ayarlar kaydedilemedi.";
    const message =
      rawMessage.toLocaleLowerCase("tr-TR").includes("secret key") || rawMessage.toLocaleLowerCase("tr-TR").includes("hatalı secret key")
        ? "SecretKey doğrulanamadı. Test endpoint için test key, canlı endpoint için gerçek canlı key kullanılmalıdır."
        : rawMessage;

    return NextResponse.json({ success: false, error: { message } }, { status: 502 });
  }
}

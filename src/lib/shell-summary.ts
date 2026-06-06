import { EInvoiceProvider, ReminderStatus } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { getCustomerCreditCount, getDashboardInfo, loginToHizliBilisim } from "@/lib/integrations/hizli-bilisim";

function formatDateTime(value?: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function formatCreditCount(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 0,
  }).format(value);
}

const getSidebarProviderSummaryCached = unstable_cache(
  async (tenantId: string) => {
    let settings = await db.eInvoiceSettings.findUnique({ where: { tenantId } });

    if (!settings) {
      return {
        providerLabel: "Bağlı değil",
        environmentLabel: "Tanımsız",
        creditCount: null,
        senderAlias: null,
        updatedAtLabel: "-",
        lowCredit: false,
      };
    }

    const endpoint = settings.serviceEndpoint?.toLowerCase() ?? "";
    const environmentLabel = endpoint.includes("econnecttest")
      ? "Test"
      : endpoint.includes("econnect.hizliteknoloji.com.tr")
        ? "Canlı"
        : settings.testMode
          ? "Test"
          : "Canlı";

    const shouldRefreshCredit =
      settings.provider === EInvoiceProvider.HIZLI_BILISIM &&
      Boolean(settings.senderTaxNumber && settings.serviceEndpoint && settings.serviceUsername && settings.servicePassword && settings.serviceApiKey) &&
      (!settings.serviceCreditUpdatedAt || Date.now() - settings.serviceCreditUpdatedAt.getTime() > 5 * 60 * 1000);

    if (shouldRefreshCredit && settings.senderTaxNumber) {
      try {
        const login = await loginToHizliBilisim(settings);
        if (login.success) {
          const [creditInfo, dashboard] = await Promise.all([
            getCustomerCreditCount(settings, settings.senderTaxNumber, login),
            getDashboardInfo(settings, settings.senderTaxNumber, login),
          ]);

          const nextCreditCount = creditInfo.remainCredit ?? dashboard.creditRemainder ?? settings.serviceCreditCount ?? null;
          settings = await db.eInvoiceSettings.update({
            where: { tenantId },
            data: {
              serviceCreditCount: typeof nextCreditCount === "number" && Number.isFinite(nextCreditCount) ? Math.max(0, Math.floor(nextCreditCount)) : settings.serviceCreditCount,
              serviceCreditUpdatedAt: new Date(),
            },
          });
        }
      } catch {
        // Header akisi dis servis hatalarinda bozulmamali.
      }
    }

    return {
      providerLabel:
        settings.provider === EInvoiceProvider.HIZLI_BILISIM
          ? "Hızlı Bilişim"
          : settings.provider === EInvoiceProvider.GIB
            ? "GİB"
            : "Bağlı değil",
      environmentLabel,
      creditCount: settings.serviceCreditCount,
      senderAlias: settings.gibAlias || settings.serviceEndpoint || null,
      updatedAtLabel: formatDateTime(settings.serviceCreditUpdatedAt),
      lowCredit: typeof settings.serviceCreditCount === "number" && settings.serviceCreditCount <= 250,
    };
  },
  ["shell-sidebar-summary"],
  { revalidate: 20 },
);

const getNotificationSummaryCached = unstable_cache(
  async (tenantId: string) => {
    const now = new Date();
    const [reminders, unreadCount, openCount, overdueCount] = await Promise.all([
      db.reminder.findMany({
        where: { tenantId },
        orderBy: [{ isRead: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
        take: 12,
        select: {
          id: true,
          title: true,
          message: true,
          dueAt: true,
          status: true,
          channel: true,
          isRead: true,
          readAt: true,
          relatedType: true,
          relatedId: true,
          createdAt: true,
        },
      }),
      db.reminder.count({
        where: {
          tenantId,
          status: ReminderStatus.OPEN,
          isRead: false,
        },
      }),
      db.reminder.count({
        where: {
          tenantId,
          status: ReminderStatus.OPEN,
        },
      }),
      db.reminder.count({
        where: {
          tenantId,
          status: ReminderStatus.OPEN,
          dueAt: { lt: now },
        },
      }),
    ]);

    return {
      unreadCount,
      openCount,
      overdueCount,
      reminders: reminders.map((item) => ({
        ...item,
        dueAt: item.dueAt.toISOString(),
        readAt: item.readAt?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  },
  ["shell-notification-summary"],
  { revalidate: 15 },
);

export async function getShellSidebarProviderSummary(tenantId?: string | null) {
  if (!tenantId) {
    return null;
  }

  return getSidebarProviderSummaryCached(tenantId);
}

export async function getShellNotificationSummary(tenantId?: string | null) {
  if (!tenantId) {
    return null;
  }

  return getNotificationSummaryCached(tenantId);
}

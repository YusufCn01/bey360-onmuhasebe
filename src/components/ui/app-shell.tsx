import Link from "next/link";
import type { ReactNode } from "react";
import { EInvoiceProvider, ReminderStatus } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { LockScreenButton } from "@/components/ui/lock-screen-button";
import { MobileCommandPalette } from "@/components/ui/mobile-command-palette";
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { LogoutButton } from "@/components/ui/logout-button";
import { MobileNavDrawer } from "@/components/ui/mobile-nav-drawer";
import { NotificationCenter } from "@/components/ui/notification-center";

export type ShellNavItem = {
  href?: string;
  label: string;
  icon?: string;
  badge?: string;
  children?: Array<{
    href: string;
    label: string;
  }>;
};

export type ShellNavGroup = {
  title: string;
  items: ShellNavItem[];
};

function isItemActive(currentPath: string, item: ShellNavItem) {
  if (item.href) {
    return currentPath === item.href || (item.href !== "/panel" && currentPath.startsWith(item.href));
  }

  return item.children?.some((child) => currentPath === child.href || currentPath.startsWith(child.href)) ?? false;
}

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

function formatCreditCount(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 0,
  }).format(value);
}

function renderNavIcon(icon?: string) {
  const common = "h-4.5 w-4.5";

  switch (icon) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5.5 9.5V21h13V9.5" />
          <path d="M9.5 21v-6h5v6" />
        </svg>
      );
    case "sales":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M4 19h16" />
          <path d="M6 16l4-5 3 3 5-7" />
          <path d="M18 7h2v2" />
        </svg>
      );
    case "purchase":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M4 5h16" />
          <path d="M7 9l5 5 5-5" />
          <path d="M12 14V4" />
          <path d="M4 19h16" />
        </svg>
      );
    case "expense":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M6 4h12" />
          <path d="M7 8h10" />
          <path d="M9 12h6" />
          <path d="M4 20h16" />
        </svg>
      );
    case "contact":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M16.5 20v-1.5A3.5 3.5 0 0 0 13 15h-2a3.5 3.5 0 0 0-3.5 3.5V20" />
          <circle cx="12" cy="8" r="3" />
          <path d="M19 9h2" />
          <path d="M20 8v2" />
        </svg>
      );
    case "stock":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M4 8l8-4 8 4-8 4-8-4z" />
          <path d="M4 12l8 4 8-4" />
          <path d="M4 16l8 4 8-4" />
        </svg>
      );
    case "wallet":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5z" />
          <path d="M16 12h3" />
          <circle cx="15.5" cy="12" r=".5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "edonusum":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M7 7h10v10H7z" />
          <path d="M12 4v3" />
          <path d="M12 17v3" />
          <path d="M4 12h3" />
          <path d="M17 12h3" />
        </svg>
      );
    case "report":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M5 19V9" />
          <path d="M12 19V5" />
          <path d="M19 19v-7" />
          <path d="M3 19h18" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 1 0 12 8.5Z" />
          <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6Z" />
        </svg>
      );
    case "integrations":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <path d="M8 7h4" />
          <path d="M12 17h4" />
          <path d="M10 12h4" />
          <circle cx="6" cy="7" r="2" />
          <circle cx="18" cy="17" r="2" />
          <circle cx="8" cy="12" r="2" />
          <path d="M8 8.5l1 2" />
          <path d="M12 12h2" />
        </svg>
      );
    case "pos":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M8 9h8" />
          <path d="M8 13h3" />
          <path d="M14 13h2" />
        </svg>
      );
    default:
      return <span className="text-[11px] font-extrabold tracking-[0.14em]">{(icon ?? "..").slice(0, 2).toUpperCase()}</span>;
  }
}

async function getSidebarProviderSummary(currentPath: string) {
  if (!currentPath.startsWith("/panel")) {
    return null;
  }

  const session = await getSession();
  if (!session?.tenantId) {
    return null;
  }

  const settings = await db.eInvoiceSettings.findUnique({
    where: { tenantId: session.tenantId },
    select: {
      provider: true,
      testMode: true,
      gibAlias: true,
      serviceCreditCount: true,
      serviceCreditUpdatedAt: true,
      serviceEndpoint: true,
    },
  });

  if (!settings) {
    return {
      providerLabel: "Bağlı değil",
      environmentLabel: "Tanımsız",
      creditCount: null,
      senderAlias: null,
      updatedAtLabel: "-",
    };
  }

  return {
    providerLabel:
      settings.provider === EInvoiceProvider.HIZLI_BILISIM
        ? "Hızlı Bilişim"
        : settings.provider === EInvoiceProvider.GIB
          ? "GİB"
          : "Bağlı değil",
    environmentLabel: settings.testMode ? "Test" : "Canlı",
    creditCount: settings.serviceCreditCount,
    senderAlias: settings.gibAlias || settings.serviceEndpoint || null,
    updatedAtLabel: formatDateTime(settings.serviceCreditUpdatedAt),
  };
}

async function getNotificationSummary(currentPath: string) {
  if (!currentPath.startsWith("/panel")) {
    return null;
  }

  const session = await getSession();
  if (!session?.tenantId) {
    return null;
  }

  const now = new Date();
  const [reminders, unreadCount, openCount, overdueCount] = await Promise.all([
    db.reminder.findMany({
      where: { tenantId: session.tenantId },
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
        tenantId: session.tenantId,
        status: ReminderStatus.OPEN,
        isRead: false,
      },
    }),
    db.reminder.count({
      where: {
        tenantId: session.tenantId,
        status: ReminderStatus.OPEN,
      },
    }),
    db.reminder.count({
      where: {
        tenantId: session.tenantId,
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
}

function DesktopSidebar({
  currentPath,
  navGroups,
  userName,
  userTitle,
  providerLabel,
  environmentLabel,
  creditLabel,
  senderAlias,
  updatedAtLabel,
}: {
  currentPath: string;
  navGroups: ShellNavGroup[];
  userName: string;
  userTitle: string;
  providerLabel: string;
  environmentLabel: string;
  creditLabel: string;
  senderAlias?: string | null;
  updatedAtLabel: string;
}) {
  return (
    <aside className="hidden w-[308px] shrink-0 border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] text-white lg:flex lg:flex-col">
      <div className="border-b border-[var(--sidebar-border)] bg-gradient-to-b from-[var(--brand)] to-[#a6101c] px-6 py-5">
        <Link href="/panel" className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl font-black text-[var(--brand)]">B</div>
          <div>
            <p className="font-display text-[1.95rem] font-extrabold leading-none tracking-tight">Bey360</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-white/80">İş Yönetim Platformu</p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mb-4 px-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--sidebar-muted)]">Ana Menü</p>
        </div>

        {navGroups.map((group) => (
          <div key={group.title || "menu"} className="mb-5">
            {group.title ? <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--sidebar-muted)]">{group.title}</p> : null}

            <div className="space-y-2.5">
              {group.items.map((item) => {
                const active = isItemActive(currentPath, item);
                const iconContent = renderNavIcon(item.icon);

                if (item.children?.length) {
                  return (
                    <details
                      key={item.label}
                      open={active}
                      className={`rounded-[18px] border ${
                        active ? "border-white/12 bg-white/10 shadow-[0_12px_26px_rgba(0,0,0,0.16)]" : "border-white/6 bg-white/[0.03]"
                      }`}
                    >
                      <summary className="flex cursor-pointer list-none items-center gap-3 px-3.5 py-3 text-[14px] font-semibold text-white marker:content-none">
                        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-[12px] ${active ? "bg-white text-[var(--brand)]" : "bg-white/8 text-white/85"}`}>
                          {iconContent}
                        </span>
                        <span className="leading-5">{item.label}</span>
                        <span className="ml-auto text-xs text-white/45">{item.badge ?? ">"}</span>
                      </summary>
                      <div className="space-y-1.5 px-3 pb-3 pl-[3.6rem]">
                        {item.children.map((child) => {
                          const childActive = currentPath === child.href || currentPath.startsWith(child.href);

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={`flex items-center rounded-[10px] px-3 py-2.5 text-[13px] font-medium transition ${
                                childActive
                                  ? "bg-white text-[var(--brand)] shadow-[0_8px_18px_rgba(0,0,0,0.12)]"
                                  : "text-slate-200 hover:bg-white/8 hover:text-white"
                              }`}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    </details>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href ?? "#"}
                    className={`group flex items-center gap-3 rounded-[18px] border px-3.5 py-3 text-[14px] font-semibold transition ${
                      active
                        ? "border-white/12 bg-white/12 text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)]"
                        : "border-white/6 bg-white/[0.03] text-slate-200 hover:border-white/8 hover:bg-white/7 hover:text-white"
                    }`}
                  >
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-[12px] ${active ? "bg-white text-[var(--brand)]" : "bg-white/8 text-white/85"}`}>
                      {iconContent}
                    </span>
                    <span className="leading-5">{item.label}</span>
                    {item.badge ? (
                      <span className="ml-auto rounded-full border border-cyan-200/30 bg-cyan-300/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 border-t border-[var(--sidebar-border)] px-4 py-4">
        <div className="rounded-[18px] border border-white/10 bg-white/6 px-4 py-4">
          <p className="text-sm font-extrabold text-white">{userName}</p>
          <p className="mt-1 text-xs text-slate-300">{userTitle}</p>
          <div className="mt-3 rounded-[14px] border border-white/8 bg-white/6 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">{providerLabel}</p>
              <span className="text-[11px] font-bold text-cyan-100">{environmentLabel}</span>
            </div>
            <p className="mt-1 text-sm font-extrabold text-white">Kontör: {creditLabel}</p>
            {senderAlias ? <p className="mt-1 truncate text-[11px] text-slate-300">{senderAlias}</p> : null}
            <p className="mt-1 text-[11px] text-slate-400">Son güncelleme: {updatedAtLabel}</p>
          </div>
        </div>
        <div className="space-y-2">
          <LockScreenButton compact />
          <LogoutButton compact />
        </div>
      </div>
    </aside>
  );
}

export async function AppShell({
  title,
  subtitle,
  currentPath,
  navGroups,
  children,
  userName,
  userTitle,
  topAction,
}: {
  title: string;
  subtitle: string;
  currentPath: string;
  navGroups: ShellNavGroup[];
  children: ReactNode;
  userName: string;
  userTitle: string;
  topAction?: ReactNode;
}) {
  const [sidebarSummary, notificationSummary] = await Promise.all([
    getSidebarProviderSummary(currentPath),
    getNotificationSummary(currentPath),
  ]);

  const creditLabel = formatCreditCount(sidebarSummary?.creditCount);
  const userInitials = userName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <div className="min-h-screen bg-[var(--surface)] text-slate-800">
      <div className="flex min-h-screen">
        <DesktopSidebar
          currentPath={currentPath}
          navGroups={navGroups}
          userName={userName}
          userTitle={userTitle}
          providerLabel={sidebarSummary?.providerLabel ?? "Hızlı Bilişim"}
          environmentLabel={sidebarSummary?.environmentLabel ?? "Tanımsız"}
          creditLabel={creditLabel}
          senderAlias={sidebarSummary?.senderAlias}
          updatedAtLabel={sidebarSummary?.updatedAtLabel ?? "-"}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="h-1 w-full bg-[var(--brand)]" />

          <header className="z-20 border-b border-slate-200/80 bg-white/94 backdrop-blur-xl lg:sticky lg:top-0">
            <div className="px-3 py-2.5 sm:px-6 xl:px-8">
              <div className="flex flex-col gap-3 lg:gap-4">
                <div className="flex items-center gap-2 lg:hidden">
                  <MobileNavDrawer
                    navGroups={navGroups}
                    currentPath={currentPath}
                    userName={userName}
                    userTitle={userTitle}
                    environmentLabel={sidebarSummary?.environmentLabel ?? "Tanımsız"}
                    creditLabel={creditLabel}
                    senderAlias={sidebarSummary?.senderAlias}
                    updatedAtLabel={sidebarSummary?.updatedAtLabel ?? "-"}
                  />
                  <Link href="/panel" className="min-w-0 flex-1 border-l-2 border-[var(--brand)] pl-3.5 pr-1 py-1.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--brand)] text-sm font-black text-white">B</div>
                      <div className="min-w-0">
                        <p className="font-display truncate text-base font-extrabold tracking-tight text-slate-900">Bey360</p>
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{title}</p>
                          <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-white px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
                            {sidebarSummary?.environmentLabel ?? "Tanımsız"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <MobileCommandPalette navGroups={navGroups} />
                  {notificationSummary ? (
                    <NotificationCenter
                      initialReminders={notificationSummary.reminders}
                      initialUnreadCount={notificationSummary.unreadCount}
                      initialOpenCount={notificationSummary.openCount}
                      initialOverdueCount={notificationSummary.overdueCount}
                    />
                  ) : null}
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-extrabold text-white">
                    {userInitials}
                  </div>
                </div>

                <div className="hidden lg:flex lg:flex-col lg:gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <div className="hidden items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 lg:flex">
                      <span>Bey360</span>
                      <span className="text-[var(--brand)]">/</span>
                      <span className="truncate">{title}</span>
                    </div>
                    <div className="hidden lg:block">
                      <h1 className="font-display mt-1 text-[1.85rem] font-extrabold tracking-tight text-slate-900">{title}</h1>
                      <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{subtitle}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {topAction ? <div className="w-full sm:w-auto">{topAction}</div> : null}
                    <div className="hidden items-center gap-3 lg:flex">
                      {notificationSummary ? (
                        <NotificationCenter
                          initialReminders={notificationSummary.reminders}
                          initialUnreadCount={notificationSummary.unreadCount}
                          initialOpenCount={notificationSummary.openCount}
                          initialOverdueCount={notificationSummary.overdueCount}
                        />
                      ) : null}
                      <LockScreenButton />
                    </div>
                    <span className="hidden h-11 items-center rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 text-xs font-bold tracking-[0.18em] text-slate-600 sm:inline-flex">
                      TR
                    </span>
                    <div className="hidden items-center gap-3 rounded-[18px] border border-[var(--line)] bg-white px-3.5 py-2.5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:flex">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-extrabold text-white">{userInitials}</div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-slate-900">{userName}</p>
                        <p className="truncate text-xs text-slate-500">{userTitle}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-3 py-3 pb-28 sm:px-6 sm:py-6 sm:pb-8 xl:px-8">
            <div className="mb-4 border-b border-slate-200/80 bg-transparent px-1 pb-3 lg:hidden">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Bey360 / Panel</p>
                  <h1 className="mt-1 text-[1.1rem] font-extrabold tracking-tight text-slate-900">{title}</h1>
                  <p className="mt-1 text-[13px] leading-5 text-slate-500">{subtitle}</p>
                </div>
                {topAction ? <div className="flex flex-wrap gap-2">{topAction}</div> : null}
              </div>
            </div>
            {children}
          </div>
          <MobileBottomNav currentPath={currentPath} />
        </main>
      </div>
    </div>
  );
}


import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentUser, getSession } from "@/lib/auth";
import { LockScreenButton } from "@/components/ui/lock-screen-button";
import { LogoutButton } from "@/components/ui/logout-button";
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { MobileCommandPalette } from "@/components/ui/mobile-command-palette";
import { MobileNavDrawer } from "@/components/ui/mobile-nav-drawer";
import { NotificationCenter } from "@/components/ui/notification-center";
import { UserAccountMenu } from "@/components/ui/user-account-menu";
import {
  formatCreditCount,
  getShellNotificationSummary,
  getShellSidebarProviderSummary,
} from "@/lib/shell-summary";

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
  return getShellSidebarProviderSummary(session?.tenantId);
}

async function getNotificationSummary(currentPath: string) {
  if (!currentPath.startsWith("/panel")) {
    return null;
  }

  const session = await getSession();
  return getShellNotificationSummary(session?.tenantId);
}

async function getCurrentShellUser(currentPath: string) {
  if (!currentPath.startsWith("/panel") && !currentPath.startsWith("/kurucu")) {
    return null;
  }

  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  return {
    email: user.email,
    avatarUrl: user.avatarUrl,
  };
}

function DesktopSidebar({
  currentPath,
  navGroups,
  environmentLabel,
}: {
  currentPath: string;
  navGroups: ShellNavGroup[];
  environmentLabel: string;
}) {
  return (
    <aside className="hidden w-[318px] shrink-0 border-r border-[#d7dee6] bg-[#f7f9fb] text-slate-900 lg:flex lg:flex-col">
      <div className="border-b border-[#d7dee6] p-5">
        <Link href="/panel" className="block overflow-hidden border border-[#d7dee6] bg-white">
          <div className="border-b border-[#eef2f5] px-4 py-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-[#e4eaf0] bg-white">
                <Image
                  src="/brand/bey360-logo-transparent.png"
                  alt="Bey360"
                  width={56}
                  height={56}
                  className="h-14 w-14 object-contain"
                  priority
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[1.02rem] font-extrabold tracking-[0.01em] text-slate-950">Bey360</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">Ön Muhasebe Yönetimi</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">Finans, stok ve e-dönüşüm süreçlerini tek merkezden yönetin.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 bg-[#fbfcfd] px-4 py-3 text-[11px]">
            <div>
              <p className="font-black uppercase tracking-[0.14em] text-slate-400">Çalışma Modu</p>
              <p className="mt-1 font-semibold text-slate-700">Kurumsal panel</p>
            </div>
            <span className="border border-[#d7dee6] bg-white px-2.5 py-1 font-black uppercase tracking-[0.14em] text-slate-700">
              {environmentLabel}
            </span>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <nav className="space-y-6">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1.5">
              <div className="px-3 pb-1">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{group.title}</p>
              </div>
              {group.items.map((item) => {
                const active = isItemActive(currentPath, item);
                const iconContent = renderNavIcon(item.icon);

                if (item.children?.length) {
                  return (
                    <details key={item.label} open={active} className="group">
                      <summary
                        className={`flex cursor-pointer list-none items-center gap-3 border px-3 py-3 text-[13px] font-semibold marker:content-none ${
                          active
                            ? "border-[#cfd8e2] bg-white text-slate-950"
                            : "border-transparent text-slate-700 hover:border-[#e2e8ef] hover:bg-white"
                        }`}
                      >
                        <span
                          className={`inline-flex h-9 w-9 items-center justify-center border ${
                            active ? "border-[#d8e1ea] bg-[#f5f8fb] text-[var(--brand)]" : "border-[#e2e8ef] bg-white text-slate-500"
                          }`}
                        >
                          {iconContent}
                        </span>
                        <span className="flex-1">{item.label}</span>
                        <span className="text-slate-400 transition group-open:rotate-90">{">"}</span>
                      </summary>
                      <div className="space-y-1 pl-11 pr-2 pt-1">
                        {item.children.map((child) => {
                          const childActive = currentPath === child.href || currentPath.startsWith(child.href);
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={`block border-l px-3 py-2 text-[12px] ${
                                childActive
                                  ? "border-l-[#2c4a63] bg-white text-slate-950 font-bold"
                                  : "border-l-[#d8e1ea] text-slate-500 hover:border-l-[#9caabc] hover:bg-white hover:text-slate-900"
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
                    className={`flex items-center gap-3 border-l-2 px-3 py-3 text-[13px] font-semibold transition ${
                      active ? "border-l-[#2c4a63] bg-white text-slate-950" : "border-l-transparent text-slate-700 hover:bg-white hover:text-slate-950"
                    }`}
                  >
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center border ${
                        active ? "border-[#d8e1ea] bg-[#f5f8fb] text-[var(--brand)]" : "border-[#e2e8ef] bg-white text-slate-500"
                      }`}
                    >
                      {iconContent}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? <span className="border border-[#d8e1ea] bg-[#f5f8fb] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-600">{item.badge}</span> : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      <div className="space-y-2 border-t border-[#d7dee6] px-5 py-4">
        <LockScreenButton compact />
        <LogoutButton compact />
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
  userEmail,
  topAction,
  showWorkspaceCard = true,
}: {
  title: string;
  subtitle: string;
  currentPath: string;
  navGroups: ShellNavGroup[];
  children: ReactNode;
  userName: string;
  userTitle: string;
  userEmail?: string | null;
  topAction?: ReactNode;
  showWorkspaceCard?: boolean;
}) {
  const [shellUser, sidebarSummary, notificationSummary] = await Promise.all([
    getCurrentShellUser(currentPath),
    getSidebarProviderSummary(currentPath),
    getNotificationSummary(currentPath),
  ]);

  const userInitials = userName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const isPanel = currentPath.startsWith("/panel");
  const environmentLabel = sidebarSummary?.environmentLabel ?? "Tan\u0131ms\u0131z";
  const creditCount = sidebarSummary?.creditCount ?? null;
  const lowCredit = sidebarSummary?.lowCredit ?? false;

  return (
    <div className="min-h-screen bg-[var(--surface)] text-slate-800">
      <div className="flex min-h-screen">
        <DesktopSidebar currentPath={currentPath} navGroups={navGroups} environmentLabel={environmentLabel} />

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--panel)]">
            <div className="px-4 py-3 lg:px-7 lg:py-4">
              <div className="hidden items-center justify-between gap-6 lg:flex">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{`\u00c7al\u0131\u015fma alan\u0131`}</p>
                  <h1 className="mt-1 truncate text-[1.06rem] font-extrabold tracking-tight text-slate-950">{title}</h1>
                  <p className="mt-1 truncate text-sm text-slate-600">{subtitle}</p>
                </div>

                <div className="flex items-center gap-2.5">
                  {isPanel && creditCount !== null ? (
                    <Link
                      href="/panel/ayarlar/hizli-bilisim"
                      className={`inline-flex items-center gap-3 border px-4 py-2.5 text-sm transition ${
                        lowCredit ? "border-amber-300 bg-amber-50 text-amber-900" : "border-[var(--line)] bg-[var(--panel)] text-slate-800"
                      }`}
                    >
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{`Kont\u00f6r`}</p>
                        <p className="text-base font-extrabold">{formatCreditCount(creditCount)}</p>
                      </div>
                      {lowCredit ? (
                        <div className="max-w-[180px] text-[11px] font-semibold leading-4 text-amber-700">
                          {`250 alt\u0131na d\u00fc\u015ft\u00fc. Kont\u00f6r sat\u0131n alma zaman\u0131 geldi.`}
                        </div>
                      ) : null}
                    </Link>
                  ) : null}

                  {isPanel ? (
                    <NotificationCenter
                      initialReminders={notificationSummary?.reminders ?? []}
                      initialUnreadCount={notificationSummary?.unreadCount ?? 0}
                      initialOpenCount={notificationSummary?.openCount ?? 0}
                      initialOverdueCount={notificationSummary?.overdueCount ?? 0}
                    />
                  ) : null}

                  <UserAccountMenu
                    userName={userName}
                    userTitle={userTitle}
                    userEmail={userEmail ?? shellUser?.email}
                    avatarUrl={shellUser?.avatarUrl}
                    initials={userInitials}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 lg:hidden">
                {isPanel ? <MobileNavDrawer navGroups={navGroups} currentPath={currentPath} /> : null}

                <Link href="/panel" className="flex min-w-0 flex-1 items-center gap-3 border border-[var(--line)] bg-[var(--panel)] px-3 py-2">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-slate-200 bg-slate-50">
                    <Image
                      src="/brand/bey360-logo-transparent.png"
                      alt="Bey360"
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                      priority
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-extrabold tracking-tight text-slate-950">Bey360</span>
                    <span className="block truncate text-[11px] text-slate-500">{title}</span>
                  </span>
                </Link>

                {isPanel && creditCount !== null ? (
                  <Link
                    href="/panel/ayarlar/hizli-bilisim"
                    className={`border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] ${
                      lowCredit ? "border-amber-200 bg-amber-50 text-amber-700" : "border-[var(--line)] bg-[var(--panel)] text-slate-600"
                    }`}
                  >
                    <span className="block text-[9px] text-slate-400">{environmentLabel}</span>
                    <span className="block whitespace-nowrap">{`Kont\u00f6r `}{formatCreditCount(creditCount)}</span>
                  </Link>
                ) : null}

                {isPanel ? <MobileCommandPalette navGroups={navGroups} /> : null}
                {isPanel ? (
                  <NotificationCenter
                    initialReminders={notificationSummary?.reminders ?? []}
                    initialUnreadCount={notificationSummary?.unreadCount ?? 0}
                    initialOpenCount={notificationSummary?.openCount ?? 0}
                    initialOverdueCount={notificationSummary?.overdueCount ?? 0}
                  />
                ) : null}
              </div>
            </div>
          </header>

          <div className="flex-1 px-4 py-4 pb-24 lg:px-6 lg:py-6 lg:pb-6">
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5">
              {showWorkspaceCard ? (
                <section className="erp-card p-4 sm:p-5 lg:hidden">
                  <div className="flex flex-col gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">{`\u00c7al\u0131\u015fma alan\u0131`}</p>
                      <h2 className="mt-2 font-display text-[1.45rem] font-extrabold tracking-tight text-slate-950">{title}</h2>
                      <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{subtitle}</p>
                    </div>
                    {topAction ? <div className="flex shrink-0 flex-wrap gap-2">{topAction}</div> : null}
                  </div>
                </section>
              ) : null}

              {!showWorkspaceCard && topAction ? <div className="hidden items-center justify-end gap-2 lg:flex">{topAction}</div> : null}

              {children}
            </div>
          </div>
        </main>
      </div>

      {isPanel ? <MobileBottomNav currentPath={currentPath} /> : null}
    </div>
  );
}

import { RefreshHizliSummaryButton } from "@/components/actions/refresh-hizli-summary-button";
import { SampleHizliEFaturaSendButton } from "@/components/actions/sample-hizli-efatura-send-button";
import { SampleHizliSendButton } from "@/components/actions/sample-hizli-send-button";
import { TestHizliBilisimButton } from "@/components/actions/test-hizli-bilisim-button";
import { HizliBilisimGibLookup } from "@/components/forms/hizli-bilisim-gib-lookup";
import { HizliBilisimSettingsForm } from "@/components/forms/hizli-bilisim-settings-form";
import { AppShell } from "@/components/ui/app-shell";
import { QuickActionLink, SectionCard, StatRow, StatusPill } from "@/components/ui/module-blocks";
import { getTenantContext } from "@/lib/access";
import { db } from "@/lib/db";
import { getCustomerCreditCount, getDashboardInfo, loginToHizliBilisim } from "@/lib/integrations/hizli-bilisim";
import { tenantNavGroups } from "@/lib/navigation";

function formatDateTime(value?: Date | null) {
  if (!value) {
    return "Henüz güncellenmedi";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function compactNumber(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat("tr-TR").format(value);
}

export default async function HizliBilisimPage() {
  const { membership, tenant, user } = await getTenantContext();
  let settings = await db.eInvoiceSettings.findUnique({ where: { tenantId: tenant.id } });
  let dashboardSnapshot: {
    totalCredit?: number | null;
    remainCredit?: number | null;
    inboxCount?: number | null;
    outboxCount?: number | null;
    archiveCount?: number | null;
    despatchInboxCount?: number | null;
    despatchOutboxCount?: number | null;
  } | null = null;

  if (
    settings?.provider === "HIZLI_BILISIM" &&
    settings.senderTaxNumber &&
    settings.serviceEndpoint &&
    settings.serviceUsername &&
    settings.servicePassword &&
    settings.serviceApiKey
  ) {
    try {
      const login = await loginToHizliBilisim(settings);
      if (login.success) {
        const [creditInfo, dashboard] = await Promise.all([
          getCustomerCreditCount(settings, settings.senderTaxNumber, login),
          getDashboardInfo(settings, settings.senderTaxNumber, login),
        ]);

        const nextCreditCount = creditInfo.remainCredit ?? dashboard.creditRemainder ?? settings.serviceCreditCount ?? null;
        settings = await db.eInvoiceSettings.update({
          where: { tenantId: tenant.id },
          data: {
            serviceCreditCount: typeof nextCreditCount === "number" && Number.isFinite(nextCreditCount) ? Math.max(0, Math.floor(nextCreditCount)) : settings.serviceCreditCount,
            serviceCreditUpdatedAt: new Date(),
          },
        });

        dashboardSnapshot = {
          totalCredit: creditInfo.totalCredit ?? dashboard.creditTotal ?? null,
          remainCredit: creditInfo.remainCredit ?? dashboard.creditRemainder ?? null,
          inboxCount: dashboard.inboxCount ?? null,
          outboxCount: dashboard.outboxCount ?? null,
          archiveCount: dashboard.archiveCount ?? null,
          despatchInboxCount: dashboard.despatchInboxCount ?? null,
          despatchOutboxCount: dashboard.despatchOutboxCount ?? null,
        };
      }
    } catch {
      // Dış servis geçici hata verirse sayfa yine açılmalı.
    }
  }

  const endpoint = settings?.serviceEndpoint?.toLowerCase() ?? "";
  const isTestEndpoint = endpoint.includes("econnecttest");
  const isLiveEndpoint = endpoint.includes("econnect.hizliteknoloji.com.tr") && !isTestEndpoint;
  const environmentLabel = isLiveEndpoint ? "Canlı" : isTestEndpoint ? "Test" : "Belirsiz";
  const environmentTone = isLiveEndpoint ? "emerald" : isTestEndpoint ? "amber" : "slate";

  return (
    <AppShell
      title="Hızlı Bilişim"
      subtitle="Bağlantı, alias ve kontör bilgisini tek bir operasyon ekranında yönetin."
      currentPath="/panel/ayarlar/hizli-bilisim"
      navGroups={tenantNavGroups}
      userName={user.fullName}
      userTitle={`${membership.role} · ${tenant.planName}`}
      topAction={<QuickActionLink href="/panel/ayarlar/e-fatura" label="e-Fatura Ayarları" />}
    >
      <div className="space-y-6">
        <section className="rounded-[18px] border border-[var(--line)] bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#eef2ff_100%)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill label={settings?.provider ?? "NONE"} tone="blue" />
                <StatusPill label={environmentLabel} tone={environmentTone} />
                {settings?.gibAlias ? <StatusPill label="GB Hazır" tone="emerald" /> : <StatusPill label="GB Bekleniyor" tone="amber" />}
              </div>
              <div>
                <h2 className="text-[2rem] font-extrabold tracking-tight text-slate-950">Bağlantı özeti</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Ortam, gönderici bilgisi ve servis özeti tek bakışta burada. Test ve canlı ayrımını endpoint belirler; canlı kullanıma geçmeden önce portalden alınan gerçek WS kullanıcı adı ve şifresiyle kayıt yapılmalıdır.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[14px] border border-[var(--line)] bg-white/80 px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Kalan kontör</p>
                  <p className="mt-2 text-[1.75rem] font-extrabold text-slate-900">{compactNumber(settings?.serviceCreditCount ?? null)}</p>
                  <p className="mt-1 text-xs text-slate-500">Güncelleme: {formatDateTime(settings?.serviceCreditUpdatedAt)}</p>
                </div>
                <div className="rounded-[14px] border border-[var(--line)] bg-white/80 px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Toplam kredi</p>
                  <p className="mt-2 text-[1.75rem] font-extrabold text-slate-900">{compactNumber(dashboardSnapshot?.totalCredit)}</p>
                  <p className="mt-1 text-xs text-slate-500">Servis panel özeti</p>
                </div>
                <div className="rounded-[14px] border border-[var(--line)] bg-white/80 px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Giden / Arşiv</p>
                  <p className="mt-2 text-[1.75rem] font-extrabold text-slate-900">{compactNumber(dashboardSnapshot?.outboxCount)} / {compactNumber(dashboardSnapshot?.archiveCount)}</p>
                  <p className="mt-1 text-xs text-slate-500">Gönderilen belge yoğunluğu</p>
                </div>
                <div className="rounded-[14px] border border-[var(--line)] bg-white/80 px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Gelen belge</p>
                  <p className="mt-2 text-[1.75rem] font-extrabold text-slate-900">{compactNumber(dashboardSnapshot?.inboxCount)}</p>
                  <p className="mt-1 text-xs text-slate-500">Servis panel özeti</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-[16px] border border-[var(--line)] bg-white/85 p-4 backdrop-blur">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Hızlı Kontrol</p>
              <StatRow label="Servis adresi" value={settings?.serviceEndpoint ? (isTestEndpoint ? "Test endpoint" : isLiveEndpoint ? "Canlı endpoint" : "Özel endpoint") : "Tanımsız"} />
              <StatRow label="Gönderici VKN" value={settings?.senderTaxNumber ?? "Henüz yok"} />
              <StatRow label="Gönderici GB" value={settings?.gibAlias ?? "Henüz yok"} />
              <StatRow label="Şifreli kimlik" value={settings?.serviceUsername && settings?.servicePassword ? "Hazır" : "Eksik"} />
            </div>
          </div>
        </section>

        {isTestEndpoint ? (
          <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-4">
            <p className="text-sm font-black text-amber-800">Test servisi aktif</p>
            <p className="mt-1 text-sm text-amber-700">
              Bu ortamda gerçek e-Fatura mükellefleri görünmeyebilir. Canlı müşteri doğrulaması için canlı endpoint ve gerçek WS bilgileri gerekir.
            </p>
          </div>
        ) : null}

        {isLiveEndpoint ? (
          <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-4">
            <p className="text-sm font-black text-emerald-800">Canlı servis aktif</p>
            <p className="mt-1 text-sm text-emerald-700">
              Portalden alınan düz WS kullanıcı adı ve düz WS şifresi kullanılmalıdır. Sisteme şifreli değer yapıştırmayın; ekran kaydederken kendisi şifreler.
            </p>
          </div>
        ) : null}

        <SectionCard eyebrow="e-Dönüşüm" title="Kategori özeti">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Gelen Fatura</p>
              <p className="mt-2 text-[1.75rem] font-extrabold text-slate-900">{compactNumber(dashboardSnapshot?.inboxCount)}</p>
              <p className="mt-1 text-xs text-slate-500">Hızlı Bilişim panelinden alınır</p>
            </div>
            <div className="rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Giden Fatura</p>
              <p className="mt-2 text-[1.75rem] font-extrabold text-slate-900">{compactNumber(dashboardSnapshot?.outboxCount)}</p>
              <p className="mt-1 text-xs text-slate-500">e-Fatura çıkış belgeleri</p>
            </div>
            <div className="rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Giden e-Arşiv</p>
              <p className="mt-2 text-[1.75rem] font-extrabold text-slate-900">{compactNumber(dashboardSnapshot?.archiveCount)}</p>
              <p className="mt-1 text-xs text-slate-500">Arşiv senaryolu çıkış belgeleri</p>
            </div>
            <div className="rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Gelen İrsaliye</p>
              <p className="mt-2 text-[1.75rem] font-extrabold text-slate-900">{compactNumber(dashboardSnapshot?.despatchInboxCount)}</p>
              <p className="mt-1 text-xs text-slate-500">Alınan e-İrsaliye sayısı</p>
            </div>
            <div className="rounded-[14px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Giden İrsaliye</p>
              <p className="mt-2 text-[1.75rem] font-extrabold text-slate-900">{compactNumber(dashboardSnapshot?.despatchOutboxCount)}</p>
              <p className="mt-1 text-xs text-slate-500">Gönderilen e-İrsaliye sayısı</p>
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionCard eyebrow="Bağlantı Ayarı" title="Servis bilgilerini düzenle">
            <HizliBilisimSettingsForm
              initial={{
                serviceSecretKey: settings?.serviceSecretKey ?? "",
                serviceApiKey: settings?.serviceApiKey ?? "",
                serviceUsername: "",
                servicePassword: "",
                serviceCompanyCode: settings?.serviceCompanyCode ?? "",
                serviceEndpoint: settings?.serviceEndpoint ?? "",
                serviceCreditCount: settings?.serviceCreditCount?.toString() ?? "",
                hasEncryptedCredentials: Boolean(settings?.serviceUsername && settings?.servicePassword),
              }}
            />
          </SectionCard>

          <SectionCard eyebrow="Hızlı İşlemler" title="Bağlantı ve gönderim araçları">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <TestHizliBilisimButton />
                <RefreshHizliSummaryButton />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SampleHizliSendButton />
                <SampleHizliEFaturaSendButton />
              </div>
              <div className="rounded-[14px] border border-dashed border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4">
                <p className="text-sm font-black text-slate-900">Akış özeti</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  <li>Yeni kullanıcı bilgisi önce `UtilEncrypt` ile şifrelenir.</li>
                  <li>`Bağlantıyı Test Et` login, GB, VKN ve kontör özetini yeniler.</li>
                  <li>`Kontörü Güncelle` sadece kredi ve panel verisini servis üzerinden tazeler.</li>
                  <li>Alias doğrulama ve belge gönderimi bu kayıtlarla çalışır.</li>
                </ul>
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard eyebrow="Alias Doğrulama" title="GİB kullanıcı ve alias sorgulama">
          <HizliBilisimGibLookup />
        </SectionCard>
      </div>
    </AppShell>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ActivityIndicator, Animated, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { MobileDashboardPayload } from "../types/mobile";
import { palette } from "../ui/theme";

type SectionKey = "dashboard" | "sales" | "purchases" | "customers" | "stock" | "finance" | "reports" | "edoc" | "alerts" | "settings";
type ReportKey = "sales" | "finance" | "edoc" | "resources";
type DashboardResponse = { success: boolean; data?: MobileDashboardPayload; error?: { message?: string } };
type SettingsPayload = { provider: string; environment: string; serviceUsername: string; servicePassword: string; serviceCompanyCode: string; serviceEndpoint: string; serviceMeslekMensubuKey: string; hasEncryptedCredentials: boolean; hasDeveloperKeys: boolean; hasMeslekMensubuKey: boolean; senderAlias: string | null };
type SettingsResponse = { success: boolean; data?: SettingsPayload; error?: { message?: string } };
type ReportDefinition = { key: ReportKey; title: string; subtitle: string; highlightLabel: string; highlightValue: string; chart: Array<{ label: string; value: number; compareValue?: number; accent?: boolean }>; summary: Array<{ label: string; value: string }>; details: Array<{ label: string; value: string }>; comparison?: Array<{ label: string; current: string; previous: string; delta: string }> };
type ReportResponse = { success: boolean; data?: ReportDefinition; error?: { message?: string } };

const SETTINGS_DEFAULTS: SettingsPayload = { provider: "HIZLI_BILISIM", environment: "Belirsiz", serviceUsername: "", servicePassword: "", serviceCompanyCode: "", serviceEndpoint: "", serviceMeslekMensubuKey: "", hasEncryptedCredentials: false, hasDeveloperKeys: false, hasMeslekMensubuKey: false, senderAlias: null };
const SECTION_LABELS: Record<SectionKey, string> = { dashboard: "Genel Bakış", sales: "Satışlar", purchases: "Alışlar", customers: "Cari Kartlar", stock: "Ürün ve Hizmetler", finance: "Finans", reports: "Raporlar", edoc: "E-Dönüşüm", alerts: "Bildirimler", settings: "Ayarlar" };
const RADIAL_ACTIONS: Array<{ key: string; label: string; section: SectionKey; x: number; y: number }> = [
  { key: "sales", label: "Satış", section: "sales", x: 0, y: -112 },
  { key: "retail", label: "Perakende", section: "sales", x: -90, y: -74 },
  { key: "purchase", label: "Alış", section: "purchases", x: 90, y: -74 },
  { key: "customer", label: "Cari", section: "customers", x: -112, y: 4 },
  { key: "product", label: "Ürün", section: "stock", x: 112, y: 4 },
  { key: "report", label: "Rapor", section: "reports", x: 0, y: 56 },
];

const formatCurrency = (value?: number | null) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value || 0);
const formatNumber = (value?: number | null) => (typeof value === "number" && Number.isFinite(value) ? new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value) : "-");
const formatDate = (value?: string | null) => (value ? new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)) : "-");

function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <View style={styles.card}><View style={styles.cardHead}><Text style={styles.cardTitle}>{title}</Text>{action}</View>{children}</View>;
}
function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{label}</Text><Text style={[styles.summaryValue, strong && styles.summaryValueStrong]}>{value}</Text></View>;
}
function LineItem({ title, subtitle, value, badge }: { title: string; subtitle: string; value: string; badge: string }) {
  return <View style={styles.lineItem}><View style={styles.lineBody}><Text style={styles.lineTitle}>{title}</Text><Text style={styles.lineSubtitle}>{subtitle}</Text></View><View style={styles.lineMeta}><Text style={styles.lineValue}>{value}</Text><Text style={styles.lineBadge}>{badge}</Text></View></View>;
}
function ReportRow({ title, subtitle, metricLabel, metricValue, onPress }: { title: string; subtitle: string; metricLabel: string; metricValue: string; onPress: () => void }) {
  return <Pressable style={styles.reportRow} onPress={onPress}><View style={styles.lineBody}><Text style={styles.lineTitle}>{title}</Text><Text style={styles.lineSubtitle}>{subtitle}</Text></View><View style={styles.lineMeta}><Text style={styles.lineBadge}>{metricLabel}</Text><Text style={styles.lineValue}>{metricValue}</Text></View></Pressable>;
}
function SectionLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}
function Chart({ items }: { items: ReportDefinition["chart"] }) {
  const max = Math.max(...items.flatMap((item) => [item.value, item.compareValue ?? 0]), 1);
  return <View style={styles.chartWrap}>{items.map((item) => <View key={item.label} style={styles.chartRow}><View style={styles.chartHead}><Text style={styles.lineSubtitle}>{item.label}</Text><Text style={styles.lineValue}>{formatNumber(item.value)}</Text></View><View style={styles.chartTrack}>{typeof item.compareValue === "number" ? <View style={[styles.chartMarker, { left: `${Math.max(4, (item.compareValue / max) * 100)}%` }]} /> : null}<View style={[styles.chartFill, item.accent && styles.chartFillAccent, { width: `${Math.max(8, (item.value / max) * 100)}%` }]} /></View></View>)}</View>;
}

export function HomeScreen({ baseUrl, sessionToken, onSignOut }: { baseUrl: string; sessionToken: string | null; onSignOut: () => void }) {
  const [section, setSection] = useState<SectionKey>("dashboard");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [menuGroups, setMenuGroups] = useState({ operations: false, edoc: false });
  const [quickVisible, setQuickVisible] = useState(false);
  const quickAnim = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MobileDashboardPayload | null>(null);
  const [settings, setSettings] = useState<SettingsPayload>(SETTINGS_DEFAULTS);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [reportPage, setReportPage] = useState<ReportKey | null>(null);
  const [reportData, setReportData] = useState<ReportDefinition | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const [reportMore, setReportMore] = useState(false);
  const [reportFrom, setReportFrom] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [reportTo, setReportTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [partyFilter, setPartyFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const requestHeaders = useMemo(() => sessionToken ? { Authorization: `Bearer ${sessionToken}` } : undefined, [sessionToken]);

  const loadDashboard = useCallback(async (mode: "boot" | "refresh" = "boot") => {
    if (!requestHeaders) return;
    if (mode === "boot") setLoading(true); else setRefreshing(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/api/mobile/dashboard`, { headers: requestHeaders });
      const payload = await response.json() as DashboardResponse;
      if (!response.ok || !payload.success || !payload.data) throw new Error(payload.error?.message || "Mobil panel verisi alınamadı.");
      setData(payload.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mobil panel verisi alınamadı.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [baseUrl, requestHeaders]);

  const loadSettings = useCallback(async () => {
    if (!requestHeaders) return;
    try {
      const response = await fetch(`${baseUrl}/api/mobile/settings`, { headers: requestHeaders });
      const payload = await response.json() as SettingsResponse;
      if (!response.ok || !payload.success || !payload.data) throw new Error(payload.error?.message || "Ayarlar alınamadı.");
      setSettings(payload.data);
    } catch (err) {
      setSettingsMessage(err instanceof Error ? err.message : "Ayarlar alınamadı.");
    }
  }, [baseUrl, requestHeaders]);

  const openReport = useCallback(async (key: ReportKey) => {
    if (!requestHeaders) return;
    setReportPage(key);
    setReportLoading(true);
    setReportMessage(null);
    try {
      const query = new URLSearchParams({ report: key, from: reportFrom, to: reportTo });
      if (partyFilter.trim()) query.set("party", partyFilter.trim());
      if (productFilter.trim()) query.set("product", productFilter.trim());
      if (statusFilter.trim()) query.set("status", statusFilter.trim());
      const response = await fetch(`${baseUrl}/api/mobile/reports?${query.toString()}`, { headers: requestHeaders });
      const payload = await response.json() as ReportResponse;
      if (!response.ok || !payload.success || !payload.data) throw new Error(payload.error?.message || "Rapor alınamadı.");
      setReportData(payload.data);
    } catch (err) {
      setReportData(null);
      setReportMessage(err instanceof Error ? err.message : "Rapor alınamadı.");
    } finally {
      setReportLoading(false);
    }
  }, [baseUrl, partyFilter, productFilter, reportFrom, reportTo, requestHeaders, statusFilter]);

  useEffect(() => { void loadDashboard(); void loadSettings(); }, [loadDashboard, loadSettings]);

  const closeQuick = useCallback(() => {
    Animated.spring(quickAnim, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 0 }).start(() => setQuickVisible(false));
  }, [quickAnim]);
  const toggleQuick = useCallback(() => {
    if (quickVisible) return closeQuick();
    setQuickVisible(true);
    Animated.spring(quickAnim, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 6 }).start();
  }, [closeQuick, quickAnim, quickVisible]);

  const saveSettings = useCallback(async () => {
    if (!requestHeaders) return;
    setSettingsBusy(true);
    setSettingsMessage(null);
    try {
      const response = await fetch(`${baseUrl}/api/mobile/settings`, { method: "POST", headers: { "Content-Type": "application/json", ...requestHeaders }, body: JSON.stringify({ serviceUsername: settings.serviceUsername, servicePassword: settings.servicePassword, serviceCompanyCode: settings.serviceCompanyCode, serviceMeslekMensubuKey: settings.serviceMeslekMensubuKey }) });
      const payload = await response.json() as SettingsResponse;
      if (!response.ok || !payload.success || !payload.data) throw new Error(payload.error?.message || "Ayarlar kaydedilemedi.");
      setSettings(payload.data);
      setSettingsMessage("Ayarlar kaydedildi.");
    } catch (err) {
      setSettingsMessage(err instanceof Error ? err.message : "Ayarlar kaydedilemedi.");
    } finally {
      setSettingsBusy(false);
    }
  }, [baseUrl, requestHeaders, settings]);

  const reportCards = [
    { key: "sales" as const, title: "Satış Raporu", subtitle: "Satış tutarı, tahsilat ve sipariş akışı", metricLabel: "Fatura", metricValue: formatNumber(data?.metrics.salesInvoiceCount) },
    { key: "finance" as const, title: "Finans Raporu", subtitle: "Kasa, banka ve açık ödeme görünümü", metricLabel: "Açık ödeme", metricValue: formatCurrency(data?.metrics.payable) },
    { key: "edoc" as const, title: "E-Belge Raporu", subtitle: "Canlı kutu hareketi ve kontör durumu", metricLabel: "Kontör", metricValue: formatNumber(data?.provider.creditCount) },
    { key: "resources" as const, title: "Kaynak Raporu", subtitle: "Cari, tedarikçi ve stok kartları", metricLabel: "Kart", metricValue: formatNumber((data?.metrics.customerCount || 0) + (data?.metrics.supplierCount || 0) + (data?.metrics.productCount || 0)) },
  ];

  function openSection(nextSection: SectionKey) {
    setDrawerVisible(false);
    setSection(nextSection);
    setMenuGroups({ operations: false, edoc: false });
  }

  function renderBody() {
    if (!data) return null;
    if (section === "dashboard") return <><View style={styles.hero}><Text style={styles.heroTitle}>{data.tenant.name}</Text><Text style={styles.heroMeta}>{data.user.fullName} • {data.user.role}</Text><View style={styles.heroChips}><Text style={styles.heroChip}>Kod {data.tenant.code}</Text><Text style={styles.heroChip}>Plan {data.tenant.planName}</Text><Text style={styles.heroChip}>Kontör {formatNumber(data.provider.creditCount)}</Text></View></View><Card title="Özet">{[{ label: "Aylık satış", value: formatCurrency(data.metrics.monthlySales) }, { label: "Aylık alış", value: formatCurrency(data.metrics.monthlyPurchases) }, { label: "Tahsil edilecek", value: formatCurrency(data.metrics.receivable) }, { label: "Ödenecek", value: formatCurrency(data.metrics.payable) }].map((item) => <SummaryRow key={item.label} label={item.label} value={item.value} />)}</Card><Card title="Hızlı Menü"><Pressable style={styles.slimRow} onPress={() => setSection("sales")}><Text style={styles.slimRowTitle}>Satış faturaları</Text><Text style={styles.slimRowMeta}>{formatNumber(data.metrics.salesInvoiceCount)} belge</Text></Pressable><Pressable style={styles.slimRow} onPress={() => setSection("finance")}><Text style={styles.slimRowTitle}>Finans görünümü</Text><Text style={styles.slimRowMeta}>{formatCurrency(data.metrics.payable)} açık ödeme</Text></Pressable><Pressable style={styles.slimRow} onPress={() => setSection("reports")}><Text style={styles.slimRowTitle}>Canlı raporlar</Text><Text style={styles.slimRowMeta}>PDF, yazdır ve Excel</Text></Pressable></Card><Card title="Son satışlar">{data.recentSalesInvoices.map((item) => <LineItem key={item.id} title={item.customerName} subtitle={`${item.invoiceNo} • ${formatDate(item.issueDate)}`} value={formatCurrency(item.grandTotal)} badge={item.status} />)}</Card><Card title="Son hatırlatmalar">{data.reminders.items.map((item) => <LineItem key={item.id} title={item.title} subtitle={`${item.channel} • ${formatDate(item.dueAt)}`} value={item.isRead ? "Okundu" : "Yeni"} badge={item.status} />)}</Card></>;
    if (section === "sales") return <Card title="Satışlar">{data.recentSalesInvoices.map((item) => <LineItem key={item.id} title={item.customerName} subtitle={`${item.invoiceNo} • ${formatDate(item.issueDate)}`} value={formatCurrency(item.grandTotal)} badge={item.status} />)}</Card>;
    if (section === "purchases") return <Card title="Alışlar">{data.recentPurchaseInvoices.map((item) => <LineItem key={item.id} title={item.supplierName} subtitle={`${item.invoiceNo} • ${formatDate(item.issueDate)}`} value={formatCurrency(item.grandTotal)} badge={item.status} />)}</Card>;
    if (section === "customers") return <Card title="Cari Kartlar">{data.recentCustomers.map((item) => <LineItem key={item.id} title={item.name} subtitle={`${item.code} • ${item.city || "Şehir yok"}`} value={formatCurrency(item.balance)} badge={item.eInvoiceRegistered ? "E-Fatura" : "Standart"} />)}</Card>;
    if (section === "stock") return <Card title="Ürün ve Hizmetler">{data.recentProducts.map((item) => <LineItem key={item.id} title={item.name} subtitle={`${item.code} • ${item.kind} • ${item.unit}`} value={formatCurrency(item.salePrice)} badge={`${formatNumber(item.stockQty)} stok`} />)}</Card>;
    if (section === "finance") return <><Card title="Finans Özeti"><SummaryRow label="Tahsil edilecek" value={formatCurrency(data.metrics.receivable)} /><SummaryRow label="Ödenecek" value={formatCurrency(data.metrics.payable)} strong /></Card><Card title="Kasa hesapları">{data.cashAccounts.map((item) => <LineItem key={item.id} title={item.name} subtitle="Kasa hesabı" value={formatCurrency(item.balance)} badge="Kasa" />)}</Card><Card title="Banka hesapları">{data.bankAccounts.map((item) => <LineItem key={item.id} title={item.bankName} subtitle={item.iban} value={formatCurrency(item.balance)} badge="Banka" />)}</Card></>;
    if (section === "reports") return <><Card title="Raporlar" action={<Text style={styles.rangeHint}>{reportFrom} • {reportTo}</Text>}><View style={styles.reportIntro}><Text style={styles.reportIntroTitle}>Canlı rapor merkezi</Text><Text style={styles.reportIntroText}>Dönem seç, gerekiyorsa filtreleri aç ve çıktıyı doğrudan PDF, yazdır veya Excel olarak al.</Text></View>{reportCards.map((item) => <ReportRow key={item.key} title={item.title} subtitle={item.subtitle} metricLabel={item.metricLabel} metricValue={item.metricValue} onPress={() => void openReport(item.key)} />)}</Card><Card title="Dönem" action={<Pressable onPress={() => setReportMore((current) => !current)}><Text style={styles.linkText}>{reportMore ? "Filtreleri gizle" : "Detay filtreleri göster"}</Text></Pressable>}><View style={styles.inlineInputs}><TextInput style={styles.input} value={reportFrom} onChangeText={setReportFrom} placeholder="Başlangıç" /><TextInput style={styles.input} value={reportTo} onChangeText={setReportTo} placeholder="Bitiş" /></View>{reportMore ? <View style={styles.formBlock}><TextInput style={styles.input} value={partyFilter} onChangeText={setPartyFilter} placeholder="Müşteri / cari / ünvan" /><TextInput style={styles.input} value={productFilter} onChangeText={setProductFilter} placeholder="Ürün / belge no" /><TextInput style={styles.input} value={statusFilter} onChangeText={setStatusFilter} placeholder="Durum" /></View> : null}</Card></>;
    if (section === "edoc") return <><Card title="E-Dönüşüm Özeti"><SummaryRow label="Sağlayıcı" value={data.provider.provider || "-"} /><SummaryRow label="Ortam" value={data.provider.environment || "-"} /><SummaryRow label="Gönderici alias" value={data.provider.senderAlias || "-"} /><SummaryRow label="Kalan kontör" value={formatNumber(data.provider.creditCount)} strong /></Card><Card title="Son e-belgeler">{data.recentEDocuments.map((item) => <LineItem key={item.id} title={item.customerName || "Bağlı müşteri yok"} subtitle={`${item.invoiceNo} • ${item.scenario} • ${formatDate(item.createdAt)}`} value={item.status} badge="Belge" />)}</Card></>;
    if (section === "alerts") return <Card title="Bildirimler">{data.reminders.items.map((item) => <LineItem key={item.id} title={item.title} subtitle={`${item.message || "Açıklama yok"} • ${formatDate(item.dueAt)}`} value={item.isRead ? "Okundu" : "Yeni"} badge={item.status} />)}</Card>;
    return <><Card title="Bağlantı Ayarları"><View style={styles.formBlock}><TextInput style={styles.input} value={settings.serviceUsername} onChangeText={(value) => setSettings((current) => ({ ...current, serviceUsername: value }))} placeholder="Entegratör kullanıcı adı" /><TextInput style={styles.input} value={settings.servicePassword} onChangeText={(value) => setSettings((current) => ({ ...current, servicePassword: value }))} placeholder="Entegratör şifre" secureTextEntry /><TextInput style={styles.input} value={settings.serviceCompanyCode} onChangeText={(value) => setSettings((current) => ({ ...current, serviceCompanyCode: value }))} placeholder="Firma kodu" /><TextInput style={styles.input} value={settings.serviceMeslekMensubuKey} onChangeText={(value) => setSettings((current) => ({ ...current, serviceMeslekMensubuKey: value }))} placeholder="TÜRMOB anahtarı" /></View><SummaryRow label="Sağlayıcı" value={settings.provider} /><SummaryRow label="Ortam" value={settings.environment} /><SummaryRow label="Alias" value={settings.senderAlias || "-"} /><SummaryRow label="Şifreli bilgi kayıtlı" value={settings.hasEncryptedCredentials ? "Evet" : "Hayır"} />{settingsMessage ? <Text style={[styles.statusText, settingsMessage === "Ayarlar kaydedildi." ? styles.statusOk : styles.statusError]}>{settingsMessage}</Text> : null}<Pressable style={[styles.primaryButton, settingsBusy && styles.buttonDisabled]} disabled={settingsBusy} onPress={() => void saveSettings()}><Text style={styles.primaryButtonText}>{settingsBusy ? "Kaydediliyor..." : "Ayarları Kaydet"}</Text></Pressable></Card><Card title="İşlemler"><Pressable style={styles.slimRow} onPress={onSignOut}><Text style={styles.slimRowTitle}>Güvenli çıkış</Text><Text style={styles.slimRowMeta}>Oturumu kapat</Text></Pressable></Card></>;
  }

  return <View style={styles.screen}><View style={styles.header}><Pressable style={styles.headerButton} onPress={() => { setMenuGroups({ operations: false, edoc: false }); setDrawerVisible(true); }}><Text style={styles.headerButtonText}>≡</Text></Pressable><View style={styles.headerBody}><Text style={styles.headerTitle}>Bey360 Mobil</Text><Text style={styles.headerSubtitle}>{SECTION_LABELS[section]}</Text></View><Pressable style={styles.headerButton} onPress={() => openSection("reports")}><Text style={styles.headerButtonText}>▥</Text></Pressable></View>{loading ? <View style={styles.centered}><ActivityIndicator size="large" color={palette.brand} /></View> : error ? <View style={styles.centered}><Text style={styles.errorText}>{error}</Text><Pressable style={styles.primaryButton} onPress={() => void loadDashboard()}><Text style={styles.primaryButtonText}>Tekrar Dene</Text></Pressable></View> : <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadDashboard("refresh")} tintColor={palette.brand} />}>{renderBody()}</ScrollView>}

  {quickVisible ? <Pressable style={styles.quickBackdrop} onPress={closeQuick}><View /></Pressable> : null}
  {quickVisible ? <View pointerEvents="box-none" style={styles.quickLayer}><Animated.View style={[styles.quickOrbit, { opacity: quickAnim, transform: [{ scale: quickAnim }] }]} /><Animated.View style={[styles.quickOrbitSoft, { opacity: quickAnim, transform: [{ scale: quickAnim }] }]} />{RADIAL_ACTIONS.map((item) => { const translateX = quickAnim.interpolate({ inputRange: [0, 1], outputRange: [0, item.x] }); const translateY = quickAnim.interpolate({ inputRange: [0, 1], outputRange: [0, item.y] }); const opacity = quickAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }); return <Animated.View key={item.key} style={[styles.quickItem, { opacity, transform: [{ translateX }, { translateY }, { scale: quickAnim }] }]}><Pressable style={styles.quickAction} onPress={() => { closeQuick(); setSection(item.section); }}><Text style={styles.quickActionText}>{item.label}</Text></Pressable></Animated.View>; })}</View> : null}

  <View style={styles.bottomBar}><Pressable style={styles.bottomAction} onPress={() => openSection("settings")}><Text style={styles.bottomActionText}>Ayarlar</Text></Pressable><Pressable style={styles.centerAction} onPress={toggleQuick}><Text style={styles.centerActionText}>{quickVisible ? "Kapat" : "Hızlı"}</Text></Pressable><Pressable style={styles.bottomAction} onPress={() => { setMenuGroups({ operations: false, edoc: false }); setDrawerVisible(true); }}><Text style={styles.bottomActionText}>Menü</Text></Pressable></View>

  <Modal animationType="slide" transparent visible={drawerVisible} onRequestClose={() => setDrawerVisible(false)}><View style={styles.drawerOverlay}><Pressable style={styles.drawerScrim} onPress={() => setDrawerVisible(false)} /><View style={styles.drawer}><View style={styles.drawerHead}><Text style={styles.drawerTitle}>{data?.tenant.name || "Bey360"}</Text><Text style={styles.drawerMeta}>{data?.tenant.code || "-"} • Mobil Panel</Text><View style={styles.drawerHeadChips}><Text style={styles.drawerHeadChip}>{data?.tenant.planName || "Plan yok"}</Text><Text style={styles.drawerHeadChip}>{data?.tenant.status || "Aktif"}</Text></View></View><ScrollView contentContainerStyle={styles.drawerContent}><SectionLabel>Yönetim</SectionLabel><Pressable style={styles.drawerRow} onPress={() => openSection("dashboard")}><Text style={styles.drawerRowText}>Ana Menü</Text></Pressable><Pressable style={styles.drawerRow} onPress={() => openSection("reports")}><Text style={styles.drawerRowText}>Raporlar</Text></Pressable><SectionLabel>Modüller</SectionLabel><Pressable style={styles.drawerRow} onPress={() => setMenuGroups((current) => ({ ...current, operations: !current.operations }))}><Text style={styles.drawerRowText}>İşlemler</Text><Text style={styles.drawerArrow}>{menuGroups.operations ? "−" : "+"}</Text></Pressable>{menuGroups.operations ? <View style={styles.drawerSubGroup}><Pressable style={styles.drawerSubRow} onPress={() => openSection("sales")}><Text style={styles.drawerSubText}>Satışlar</Text></Pressable><Pressable style={styles.drawerSubRow} onPress={() => openSection("purchases")}><Text style={styles.drawerSubText}>Alışlar</Text></Pressable><Pressable style={styles.drawerSubRow} onPress={() => openSection("customers")}><Text style={styles.drawerSubText}>Cari Kartlar</Text></Pressable><Pressable style={styles.drawerSubRow} onPress={() => openSection("stock")}><Text style={styles.drawerSubText}>Stok İşlemleri</Text></Pressable><Pressable style={styles.drawerSubRow} onPress={() => openSection("finance")}><Text style={styles.drawerSubText}>Kasa ve Banka</Text></Pressable></View> : null}<Pressable style={styles.drawerRow} onPress={() => setMenuGroups((current) => ({ ...current, edoc: !current.edoc }))}><Text style={styles.drawerRowText}>E-Dönüşüm</Text><Text style={styles.drawerArrow}>{menuGroups.edoc ? "−" : "+"}</Text></Pressable>{menuGroups.edoc ? <View style={styles.drawerSubGroup}><Pressable style={styles.drawerSubRow} onPress={() => openSection("edoc")}><Text style={styles.drawerSubText}>E-Fatura</Text></Pressable><Pressable style={styles.drawerSubRow} onPress={() => openSection("alerts")}><Text style={styles.drawerSubText}>Bildirimler</Text></Pressable></View> : null}<SectionLabel>Oturum</SectionLabel><Pressable style={styles.drawerRow} onPress={() => openSection("settings")}><Text style={styles.drawerRowText}>Ayarlar</Text></Pressable><Pressable style={styles.drawerRow} onPress={onSignOut}><Text style={styles.drawerRowText}>Çıkış Yap</Text></Pressable></ScrollView></View></View></Modal>

  <Modal animationType="slide" visible={Boolean(reportPage)} onRequestClose={() => setReportPage(null)}><View style={styles.reportScreen}><View style={styles.header}><Pressable style={styles.headerButton} onPress={() => setReportPage(null)}><Text style={styles.headerButtonText}>←</Text></Pressable><View style={styles.headerBody}><Text style={styles.headerTitle}>{reportData?.title || "Rapor"}</Text><Text style={styles.headerSubtitle}>{reportData?.details.find((item) => item.label === "Tarih aralığı")?.value || `${reportFrom} • ${reportTo}`}</Text></View></View><ScrollView contentContainerStyle={styles.content}>{reportLoading ? <View style={styles.centered}><ActivityIndicator size="large" color={palette.brand} /></View> : reportMessage ? <View style={styles.centered}><Text style={styles.errorText}>{reportMessage}</Text></View> : reportData ? <><Card title={reportData.title}><Text style={styles.reportHeroLabel}>{reportData.highlightLabel}</Text><Text style={styles.reportHeroValue}>{reportData.highlightValue}</Text><Text style={styles.lineSubtitle}>{reportData.subtitle}</Text><View style={styles.reportHeroChips}>{reportData.summary.slice(0, 3).map((item) => <View key={item.label} style={styles.reportChip}><Text style={styles.reportChipLabel}>{item.label}</Text><Text style={styles.reportChipValue}>{item.value}</Text></View>)}</View></Card><Card title="Grafik"><Chart items={reportData.chart} /></Card>{reportData.comparison?.length ? <Card title="Dönem Karşılaştırması">{reportData.comparison.map((item) => <SummaryRow key={item.label} label={item.label} value={`${item.current} / ${item.previous} (${item.delta})`} />)}</Card> : null}<Card title="Detaylar">{reportData.details.map((item) => <SummaryRow key={item.label} label={item.label} value={item.value} />)}</Card><View style={styles.reportFooter}><Pressable style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Excel</Text></Pressable><Pressable style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Yazdır</Text></Pressable><Pressable style={styles.primaryButton}><Text style={styles.primaryButtonText}>PDF</Text></Pressable></View></> : null}</ScrollView></View></Modal></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { padding: 16, gap: 12, paddingBottom: 120 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 18, paddingBottom: 12, backgroundColor: palette.surface, borderBottomWidth: 1, borderBottomColor: palette.line },
  headerButton: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: palette.surfaceSoft, borderWidth: 1, borderColor: palette.line },
  headerButtonText: { color: palette.text, fontSize: 20, fontWeight: "700" },
  headerBody: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: palette.text },
  headerSubtitle: { marginTop: 2, fontSize: 12, color: palette.textSoft },
  hero: { backgroundColor: palette.surface, borderRadius: 18, borderWidth: 1, borderColor: palette.line, padding: 16, gap: 8 },
  heroTitle: { color: palette.text, fontSize: 20, fontWeight: "800" },
  heroMeta: { color: palette.textSoft, fontSize: 13 },
  heroChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  heroChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: palette.brandSoft, color: palette.brandStrong, fontSize: 12, fontWeight: "700" },
  card: { backgroundColor: palette.surface, borderRadius: 18, borderWidth: 1, borderColor: palette.line, padding: 16, gap: 12 },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  cardTitle: { color: palette.text, fontSize: 16, fontWeight: "800" },
  sectionLabel: { marginTop: 8, marginBottom: 2, color: palette.textMuted, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6 },
  rangeHint: { color: palette.textMuted, fontSize: 11, fontWeight: "600" },
  reportIntro: { paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: palette.line, gap: 4 },
  reportIntroTitle: { color: palette.text, fontSize: 14, fontWeight: "800" },
  reportIntroText: { color: palette.textSoft, fontSize: 12, lineHeight: 18 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: palette.line },
  summaryLabel: { flex: 1, color: palette.textSoft, fontSize: 13 },
  summaryValue: { color: palette.text, fontSize: 13, fontWeight: "700", textAlign: "right" },
  summaryValueStrong: { color: palette.brandStrong },
  lineItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: palette.line },
  lineBody: { flex: 1, gap: 3 },
  lineTitle: { color: palette.text, fontSize: 14, fontWeight: "700" },
  lineSubtitle: { color: palette.textSoft, fontSize: 12 },
  lineMeta: { alignItems: "flex-end", gap: 4 },
  lineValue: { color: palette.text, fontSize: 13, fontWeight: "800" },
  lineBadge: { color: palette.textMuted, fontSize: 11, fontWeight: "700" },
  reportRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: palette.line },
  inlineInputs: { flexDirection: "row", gap: 10 },
  formBlock: { gap: 10 },
  input: { flex: 1, minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surfaceSoft, color: palette.text, paddingHorizontal: 14, fontSize: 14 },
  linkText: { color: palette.brandStrong, fontSize: 12, fontWeight: "700" },
  statusText: { fontSize: 12, fontWeight: "700" },
  statusOk: { color: palette.success },
  statusError: { color: palette.danger },
  primaryButton: { minHeight: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: palette.brand, paddingHorizontal: 16 },
  primaryButtonText: { color: palette.surface, fontSize: 14, fontWeight: "800" },
  secondaryButton: { flex: 1, minHeight: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: palette.surfaceSoft, borderWidth: 1, borderColor: palette.line },
  secondaryButtonText: { color: palette.text, fontSize: 13, fontWeight: "700" },
  buttonDisabled: { opacity: 0.7 },
  slimRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: palette.line, gap: 4 },
  slimRowTitle: { color: palette.text, fontSize: 14, fontWeight: "700" },
  slimRowMeta: { color: palette.textSoft, fontSize: 12 },
  bottomBar: { position: "absolute", left: 16, right: 16, bottom: 18, height: 70, borderRadius: 22, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18 },
  bottomAction: { minWidth: 72, alignItems: "center" },
  bottomActionText: { color: palette.textSoft, fontSize: 12, fontWeight: "700" },
  centerAction: { width: 74, height: 74, borderRadius: 37, alignItems: "center", justifyContent: "center", backgroundColor: palette.brand, marginTop: -34, borderWidth: 5, borderColor: palette.background },
  centerActionText: { color: palette.surface, fontSize: 13, fontWeight: "800" },
  quickBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15,23,42,0.18)" },
  quickLayer: { position: "absolute", left: "50%", bottom: 54, width: 0, height: 0, alignItems: "center", justifyContent: "center" },
  quickOrbit: { position: "absolute", width: 168, height: 168, borderRadius: 84, backgroundColor: "rgba(255,255,255,0.7)", borderWidth: 1, borderColor: palette.line },
  quickOrbitSoft: { position: "absolute", width: 214, height: 214, borderRadius: 107, backgroundColor: "rgba(255,255,255,0.35)" },
  quickItem: { position: "absolute" },
  quickAction: { minWidth: 88, height: 42, paddingHorizontal: 14, borderRadius: 999, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center", shadowColor: palette.shadow, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  quickActionText: { color: palette.text, fontSize: 12, fontWeight: "800" },
  drawerOverlay: { flex: 1, flexDirection: "row" },
  drawerScrim: { flex: 1, backgroundColor: "rgba(15,23,42,0.18)" },
  drawer: { width: "80%", maxWidth: 320, backgroundColor: palette.surface, borderLeftWidth: 1, borderLeftColor: palette.line },
  drawerHead: { paddingHorizontal: 18, paddingTop: 34, paddingBottom: 18, backgroundColor: palette.surfaceStrong },
  drawerTitle: { color: palette.surface, fontSize: 18, fontWeight: "800" },
  drawerMeta: { marginTop: 4, color: "#cbd5e1", fontSize: 12 },
  drawerHeadChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  drawerHeadChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 11, fontWeight: "700" },
  drawerContent: { padding: 14, gap: 4 },
  drawerRow: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surfaceSoft, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  drawerRowText: { color: palette.text, fontSize: 14, fontWeight: "700" },
  drawerArrow: { color: palette.textMuted, fontSize: 18, fontWeight: "700" },
  drawerSubGroup: { gap: 4, paddingLeft: 10 },
  drawerSubRow: { minHeight: 42, borderRadius: 12, paddingHorizontal: 14, justifyContent: "center", backgroundColor: palette.backgroundMuted },
  drawerSubText: { color: palette.textSoft, fontSize: 13, fontWeight: "700" },
  reportScreen: { flex: 1, backgroundColor: palette.background },
  reportHeroLabel: { color: palette.textSoft, fontSize: 12, fontWeight: "700" },
  reportHeroValue: { color: palette.text, fontSize: 28, fontWeight: "900" },
  reportHeroChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  reportChip: { minWidth: 88, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: palette.surfaceSoft, borderWidth: 1, borderColor: palette.line, gap: 3 },
  reportChipLabel: { color: palette.textMuted, fontSize: 10, fontWeight: "700" },
  reportChipValue: { color: palette.text, fontSize: 12, fontWeight: "800" },
  chartWrap: { gap: 10 },
  chartRow: { gap: 6 },
  chartHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chartTrack: { height: 12, borderRadius: 999, backgroundColor: palette.backgroundMuted, overflow: "hidden", justifyContent: "center" },
  chartFill: { height: 12, borderRadius: 999, backgroundColor: "#90a4c9" },
  chartFillAccent: { backgroundColor: palette.brand },
  chartMarker: { position: "absolute", width: 10, height: 10, borderRadius: 5, marginLeft: -5, backgroundColor: palette.accent, zIndex: 2 },
  reportFooter: { flexDirection: "row", gap: 10, paddingBottom: 20 },
  errorText: { color: palette.danger, fontSize: 14, textAlign: "center", marginBottom: 16 },
});

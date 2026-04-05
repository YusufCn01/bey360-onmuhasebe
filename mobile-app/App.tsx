import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { API_BASE_URL } from "./src/config/api";
import { palette } from "./src/ui/theme";

type ConnectionState = "idle" | "checking" | "ok" | "error";

const modules = [
  { title: "Satış", detail: "Fatura, irsaliye ve tahsilat akışları", accent: "#fee2e2" },
  { title: "Stok", detail: "Ürün, barkod ve hızlı ekleme", accent: "#dbeafe" },
  { title: "Cari", detail: "Müşteri, tedarikçi ve e-belge kontrolü", accent: "#dcfce7" },
  { title: "Bildirimler", detail: "Hatırlatmalar ve dinamik akış merkezi", accent: "#fef3c7" },
];

const quickActions = ["Satış Faturası", "Ürün Ekle", "Tahsilat", "Bildirim Merkezi"];

export default function App() {
  const [connection, setConnection] = useState<ConnectionState>("idle");
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  const baseUrl = useMemo(() => API_BASE_URL.replace(/\/$/, ""), []);

  useEffect(() => {
    let active = true;

    async function checkConnection() {
      setConnection("checking");
      try {
        const response = await fetch(baseUrl, { method: "GET" });
        if (!active) {
          return;
        }
        setConnection(response.ok ? "ok" : "error");
        setCheckedAt(new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }));
      } catch {
        if (active) {
          setConnection("error");
          setCheckedAt(new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }));
        }
      }
    }

    checkConnection();
    return () => {
      active = false;
    };
  }, [baseUrl]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.brandEyebrow}>BEY360 MOBILE</Text>
              <Text style={styles.heroTitle}>Mobil uygulama başlangıcı hazır</Text>
              <Text style={styles.heroSubtitle}>
                Aynı yerel API ile çalışan mobil kabuğumuz hazır. Sonraki adımda giriş, oturum ve gerçek modül ekranlarını bunun üstüne bağlayacağız.
              </Text>
            </View>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>B</Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>API Adresi</Text>
              <Text style={styles.statusValue} numberOfLines={1}>{baseUrl}</Text>
            </View>
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>Bağlantı</Text>
              <View style={styles.statusInline}>
                {connection === "checking" ? <ActivityIndicator size="small" color={palette.brand} /> : null}
                <Text
                  style={[
                    styles.statusValue,
                    connection === "ok" ? styles.okText : connection === "error" ? styles.errorText : undefined,
                  ]}
                >
                  {connection === "ok"
                    ? "Hazır"
                    : connection === "error"
                      ? "Ulaşılamıyor"
                      : connection === "checking"
                        ? "Kontrol ediliyor"
                        : "Bekliyor"}
                </Text>
              </View>
              <Text style={styles.statusMeta}>{checkedAt ? `Son kontrol ${checkedAt}` : "Henüz kontrol edilmedi"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hızlı işlemler</Text>
          <Text style={styles.sectionMeta}>Mobil alt navigasyona bağlanacak çekirdek aksiyonlar</Text>
        </View>
        <View style={styles.quickActionWrap}>
          {quickActions.map((action) => (
            <Pressable key={action} style={styles.quickActionChip}>
              <Text style={styles.quickActionText}>{action}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Çekirdek modüller</Text>
          <Text style={styles.sectionMeta}>Web uygulamadaki yapının mobil karşılıkları</Text>
        </View>
        <View style={styles.moduleList}>
          {modules.map((module) => (
            <View key={module.title} style={styles.moduleCard}>
              <View style={[styles.moduleAccent, { backgroundColor: module.accent }]} />
              <View style={styles.moduleBody}>
                <Text style={styles.moduleTitle}>{module.title}</Text>
                <Text style={styles.moduleDetail}>{module.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Kurulum notu</Text>
          <Text style={styles.noteText}>
            Telefon testinde `EXPO_PUBLIC_API_BASE_URL` alanını aynı ağdaki cihazların erişebildiği IP ile kullanacağız. Şu an varsayılan olarak yerel ağ adresi tanımlı.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 42,
  },
  heroCard: {
    backgroundColor: palette.surface,
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: palette.line,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 28,
    elevation: 5,
    gap: 18,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  brandEyebrow: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },
  heroTitle: {
    marginTop: 8,
    color: palette.text,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
  },
  heroSubtitle: {
    marginTop: 10,
    color: palette.muted,
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 260,
  },
  brandBadge: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: palette.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  brandBadgeText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },
  statusRow: {
    gap: 12,
  },
  statusCard: {
    backgroundColor: palette.surfaceSoft,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.line,
    gap: 6,
  },
  statusLabel: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  statusValue: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "800",
  },
  statusMeta: {
    color: palette.muted,
    fontSize: 12,
  },
  statusInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  okText: {
    color: palette.success,
  },
  errorText: {
    color: palette.danger,
  },
  sectionHeader: {
    gap: 4,
    marginTop: 4,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 19,
    fontWeight: "800",
  },
  sectionMeta: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  quickActionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickActionChip: {
    borderRadius: 999,
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#fecdd3",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  quickActionText: {
    color: palette.brand,
    fontSize: 13,
    fontWeight: "800",
  },
  moduleList: {
    gap: 12,
  },
  moduleCard: {
    flexDirection: "row",
    backgroundColor: palette.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.line,
    overflow: "hidden",
  },
  moduleAccent: {
    width: 10,
  },
  moduleBody: {
    flex: 1,
    padding: 16,
    gap: 6,
  },
  moduleTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: "800",
  },
  moduleDetail: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  noteCard: {
    borderRadius: 22,
    backgroundColor: "#0f172a",
    padding: 18,
    gap: 8,
  },
  noteTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  noteText: {
    color: "#cbd5e1",
    fontSize: 13,
    lineHeight: 20,
  },
});

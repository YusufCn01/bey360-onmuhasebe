import Constants from "expo-constants";
import { useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const brandLogo = require("../../assets/bey360-logo.png");

type LoginResponse = {
  success: boolean;
  data?: { token?: string | null };
  error?: { message?: string };
};

const trustItems = [
  { label: "e-Dönüşüm", value: "Aktif" },
  { label: "Senkron", value: "Hazır" },
  { label: "Bağlantı", value: "Güvenli" },
];

export function LoginScreen({
  baseUrl,
  onContinue,
}: {
  baseUrl: string;
  onContinue: (token?: string | null) => void;
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const versionLabel = useMemo(() => {
    const appVersion = Constants.expoConfig?.version ?? "1.0.0";
    return `Sürüm ${appVersion}`;
  }, []);

  const canSubmit = useMemo(() => Boolean(identifier.trim() && password.trim() && !busy), [busy, identifier, password]);

  async function openExternal(path?: string) {
    const target = path ? `${baseUrl}${path}` : baseUrl;
    try {
      await Linking.openURL(target);
    } catch {
      setError("Bağlantı açılamadı. Lütfen daha sonra tekrar deneyin.");
    }
  }

  async function handleLogin() {
    if (!canSubmit) {
      setError("Devam etmek için kullanıcı alanı ve şifrenizi doldurun.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/api/auth/mobile-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier.trim(), password }),
      });

      const result = (await response.json().catch(() => null)) as LoginResponse | null;
      if (!response.ok || !result?.success) {
        throw new Error(result?.error?.message || "Giriş yapılamadı.");
      }

      onContinue(result?.data?.token ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Giriş yapılamadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroGlowLarge} />
          <View style={styles.heroGlowSmall} />

          <View style={styles.logoHalo}>
            <Image source={brandLogo} style={styles.logo} />
          </View>

          <Text style={styles.eyebrow}>Bey360 Mobil</Text>
          <Text style={styles.heroTitle}>Ön muhasebe sürecine{`\n`}hızlı ve güvenli giriş</Text>
          <Text style={styles.heroText}>Satış, cari, stok ve e-dönüşüm işlemlerinizi mobilde tek uygulamadan yönetin.</Text>

          <View style={styles.trustRow}>
            {trustItems.map((item) => (
              <View key={item.label} style={styles.trustCard}>
                <Text style={styles.trustValue}>{item.value}</Text>
                <Text style={styles.trustLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formBadge}>Güvenli Giriş</Text>
            <Text style={styles.formTitle}>Hesabınıza giriş yapın</Text>
            <Text style={styles.formText}>Web panelde kullandığınız bilgilerle oturum açabilirsiniz.</Text>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Telefon veya e-posta</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputPrefix}>ID</Text>
              <TextInput
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="Telefon numaranız veya e-posta"
                placeholderTextColor="#97a3b5"
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Şifre</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputPrefix}>PW</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Şifreniz"
                placeholderTextColor="#97a3b5"
                style={styles.input}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={handleLogin}
              />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable style={[styles.primaryButton, !canSubmit && styles.buttonDisabled]} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>{busy ? "Giriş yapılıyor" : "Panele devam et"}</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => void openExternal()}>
            <Text style={styles.secondaryButtonText}>Uygulamayı cihaza yükle</Text>
          </Pressable>

          <View style={styles.linkRow}>
            <Pressable style={styles.linkButton} onPress={() => void openExternal("/sifremi-unuttum")}>
              <Text style={styles.linkIcon}>?</Text>
              <Text style={styles.linkText}>Şifremi Unuttum</Text>
            </Pressable>
            <Pressable style={styles.linkButton} onPress={() => void openExternal("/kayit")}>
              <Text style={styles.linkIcon}>+</Text>
              <Text style={styles.linkText}>Hesap Oluştur</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{versionLabel}</Text>
          <View style={styles.footerLine} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef2f6",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 28,
    justifyContent: "center",
  },
  heroCard: {
    position: "relative",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: 30,
    backgroundColor: "#f6f8fb",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 22,
    marginBottom: 16,
  },
  heroGlowLarge: {
    position: "absolute",
    top: -40,
    right: -10,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(239,31,38,0.08)",
  },
  heroGlowSmall: {
    position: "absolute",
    left: -35,
    bottom: 10,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(22,34,54,0.05)",
  },
  logoHalo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 5,
    marginBottom: 24,
  },
  eyebrow: {
    color: "#6f7f95",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    textAlign: "center",
  },
  heroTitle: {
    marginTop: 8,
    color: "#0f172a",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    textAlign: "center",
  },
  heroText: {
    marginTop: 10,
    color: "#7b8a9d",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 280,
  },
  logo: {
    width: 88,
    height: 88,
    resizeMode: "contain",
  },
  trustRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  trustCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  trustValue: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  trustLabel: {
    marginTop: 4,
    color: "#8b98ab",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  formCard: {
    borderRadius: 28,
    backgroundColor: "#ffffff",
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: "#dde5ee",
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 3,
  },
  formHeader: {
    marginBottom: 14,
    alignItems: "center",
  },
  formBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#eef2f7",
    color: "#4d6179",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  formTitle: {
    marginTop: 12,
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  formText: {
    marginTop: 6,
    color: "#65758a",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  fieldBlock: {
    marginTop: 10,
  },
  fieldLabel: {
    marginBottom: 8,
    color: "#213042",
    fontSize: 13,
    fontWeight: "800",
  },
  inputWrap: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dbe3ec",
    backgroundColor: "#f9fbfc",
    paddingHorizontal: 14,
  },
  inputPrefix: {
    width: 28,
    color: "#91a0b3",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  input: {
    flex: 1,
    color: "#0f172a",
    fontSize: 16,
    paddingVertical: 14,
  },
  errorText: {
    marginTop: 12,
    color: "#cb1f27",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  primaryButton: {
    marginTop: 18,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: "#d91f26",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.58,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryButton: {
    marginTop: 10,
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "#ef1f26",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ef1f26",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 3,
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  linkRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  linkButton: {
    flex: 1,
    minHeight: 46,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dbe3ec",
    backgroundColor: "#f8fafc",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  linkIcon: {
    color: "#8fa0b4",
    fontSize: 16,
    fontWeight: "900",
  },
  linkText: {
    color: "#607186",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    marginTop: 28,
    gap: 12,
  },
  footerText: {
    color: "#98a5b6",
    fontSize: 13,
    fontWeight: "700",
  },
  footerLine: {
    width: 120,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#d6dfe8",
  },
});

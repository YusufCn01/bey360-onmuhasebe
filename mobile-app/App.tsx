import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from "react-native";
import { API_BASE_URL } from "./src/config/api";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import type { MobileAuthSession } from "./src/types/mobile";
import { palette } from "./src/ui/theme";

const STORAGE_KEY = "bey360-mobile-session";

export default function App() {
  const [session, setSession] = useState<MobileAuthSession | null>(null);
  const [booting, setBooting] = useState(true);
  const baseUrl = useMemo(() => API_BASE_URL.replace(/\/$/, ""), []);

  useEffect(() => {
    let active = true;

    async function hydrateSession() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!active || !stored) {
          return;
        }

        const parsed = JSON.parse(stored) as MobileAuthSession | null;
        if (parsed?.token) {
          setSession(parsed);
        }
      } catch {
        // Eski veya bozuk oturum kaydi acilisi bloklamasin.
      } finally {
        if (active) {
          setBooting(false);
        }
      }
    }

    hydrateSession();

    return () => {
      active = false;
    };
  }, []);

  async function handleContinue(token?: string | null) {
    const nextSession = token ? { token } : null;
    setSession(nextSession);

    if (nextSession) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  }

  async function handleSignOut() {
    setSession(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        {booting ? (
          <View style={styles.bootWrap}>
            <ActivityIndicator size="large" color={palette.brand} />
          </View>
        ) : session?.token ? (
          <HomeScreen baseUrl={baseUrl} sessionToken={session.token} onSignOut={handleSignOut} />
        ) : (
          <LoginScreen baseUrl={baseUrl} onContinue={handleContinue} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    flex: 1,
  },
  bootWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.background,
  },
});

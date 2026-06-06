import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

async function getNotificationsModule() {
  if (Constants.executionEnvironment === "storeClient") {
    return null;
  }

  const Notifications = await import("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  return Notifications;
}

export async function getPushPermissionStatus() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return "undetermined";
  }

  const permissions = await Notifications.getPermissionsAsync();
  return permissions.status;
}

export async function registerForPushNotificationsAsync() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    throw new Error("Expo Go icinde push bildirimi yerine gelistirme build kullanilmalidir.");
  }

  if (!Device.isDevice) {
    throw new Error("Push bildirimleri sadece fiziksel cihazlarda calisir.");
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 160, 90, 160],
      lightColor: "#2156F3",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const token = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  return token.data;
}

export async function scheduleLocalTestNotification() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    throw new Error("Expo Go icinde bildirim testi devre disi.");
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Bey360 Mobil",
      body: "Bildirim akisi sorunsuz calisiyor.",
      data: { source: "local-test" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
      repeats: false,
    },
  });
}

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { apiPost } from "./api";

// Show notifications while the app is foregrounded (banner + sound), which
// is the behavior users expect for reminder-style local notifications.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Requests notification permission, obtains an Expo push token, and
 * registers it with the backend via POST /api/notifications/push-token.
 * Returns the token, or null if permission was denied / running on a
 * simulator without push capabilities.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device; skipping token registration.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    console.warn("Notification permission not granted.");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenResponse = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  const token = tokenResponse.data;

  try {
    await apiPost("/api/notifications/push-token", {
      token,
      platform: Platform.OS === "ios" ? "ios" : "android",
    });
  } catch (error) {
    console.warn("Failed to register push token with backend", error);
  }

  return token;
}

/**
 * Schedules a local notification N minutes before a given due date/time -
 * e.g. an exam or homework deadline. Returns the scheduled notification id
 * (useful for cancelling later if the underlying item changes).
 */
export async function scheduleReminderNotification(params: {
  title: string;
  body: string;
  dueAt: Date;
  minutesBefore: number;
  data?: Record<string, unknown>;
}): Promise<string | null> {
  const fireAt = new Date(params.dueAt.getTime() - params.minutesBefore * 60_000);
  if (fireAt.getTime() <= Date.now()) {
    console.warn("Reminder time is in the past; not scheduling.", params);
    return null;
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: params.title,
      body: params.body,
      data: params.data ?? {},
      sound: true,
    },
    trigger: { date: fireAt },
  });

  return id;
}

export async function cancelReminderNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

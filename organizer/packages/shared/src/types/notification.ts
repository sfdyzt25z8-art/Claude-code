import type { NotificationCategory } from "./calendar";

export interface PushToken {
  id: string;
  userId: string;
  token: string;
  platform: "ios" | "android" | "web";
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  category: NotificationCategory | "system" | "admin";
  title: string;
  body: string;
  data: Record<string, string> | null;
  read: boolean;
  createdAt: string;
}

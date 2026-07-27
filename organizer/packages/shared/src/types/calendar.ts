export type CalendarEventCategory =
  | "homework"
  | "exam"
  | "business"
  | "personal"
  | "habit"
  | "goal"
  | "reading"
  | "study";

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  category: CalendarEventCategory;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  notes: string | null;
  createdAt: string;
}

export type NotificationCategory =
  | "goal"
  | "homework"
  | "exam"
  | "habit"
  | "reading"
  | "study";

export interface ReminderRule {
  id: string;
  userId: string;
  category: NotificationCategory;
  relatedId: string | null;
  remindAt: string;
  message: string;
  sent: boolean;
}

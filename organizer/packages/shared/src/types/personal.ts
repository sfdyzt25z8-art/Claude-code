import type { PersonalFocus } from "./mode";

export interface PersonalGoal {
  id: string;
  userId: string;
  focus: PersonalFocus;
  title: string;
  targetValue: number | null;
  currentValue: number | null;
  unit: string | null;
  dueDate: string | null;
  completed: boolean;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  focus: PersonalFocus | null;
  frequency: "daily" | "weekly";
  targetCount: number;
  createdAt: string;
  archived: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: string;
  completed: boolean;
}

export interface ProgressCheckIn {
  id: string;
  userId: string;
  focus: PersonalFocus;
  date: string;
  value: number;
  note: string | null;
}

export const PERSONAL_FOCUS_OPTIONS: PersonalFocus[] = [
  "lose_weight",
  "gain_muscle",
  "fitness",
  "productivity",
  "habits",
  "reading",
  "mental_wellness",
  "learning_skills",
];

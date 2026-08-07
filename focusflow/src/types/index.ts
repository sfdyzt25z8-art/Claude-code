export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string; // ISO date string (yyyy-mm-dd)
  category?: string;
  goalId?: string;
  createdAt: string; // ISO datetime
  completedAt?: string; // ISO datetime
}

export interface Goal {
  id: string;
  name: string;
  description?: string;
  deadline?: string; // ISO date string (yyyy-mm-dd)
  color: string;
  createdAt: string; // ISO datetime
  completedAt?: string; // ISO datetime
}

export interface Habit {
  id: string;
  name: string;
  icon: string; // lucide-react icon name
  targetDaysPerWeek: number;
  completions: string[]; // ISO date strings (yyyy-mm-dd) the habit was completed
  createdAt: string; // ISO datetime
}

export type FocusSessionType = 'focus' | 'break';

export interface FocusSession {
  id: string;
  type: FocusSessionType;
  durationMinutes: number;
  startedAt: string; // ISO datetime
  completedAt?: string; // ISO datetime — set only if the session ran to completion
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserProfile {
  name: string;
  email?: string;
}

export interface Settings {
  profile: UserProfile;
  theme: ThemeMode;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  focusDurationMinutes: number;
  breakDurationMinutes: number;
  longBreakDurationMinutes: number;
  sessionsUntilLongBreak: number;
}

export interface Statistics {
  tasksCompleted: number;
  goalsCompleted: number;
  habitCompletionRate: number; // 0-100, trailing 7 days
  focusSessionsCompleted: number;
  currentDailyStreak: number;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string; // ISO datetime
}

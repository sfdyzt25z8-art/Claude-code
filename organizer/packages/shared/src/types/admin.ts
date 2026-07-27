export interface AdminUserSummary {
  id: string;
  email: string;
  name: string | null;
  mode: string | null;
  role: "user" | "admin";
  createdAt: string;
  lastActiveAt: string | null;
  suspended: boolean;
}

export interface AdminCourse {
  id: string;
  title: string;
  academy: string;
  published: boolean;
  createdAt: string;
}

export interface AdminBook {
  id: string;
  title: string;
  author: string;
  subject: string | null;
  published: boolean;
}

export interface AdminAnalyticsSnapshot {
  date: string;
  totalUsers: number;
  activeUsers: number;
  newSignups: number;
  aiRequestCount: number;
  quizzesTaken: number;
}

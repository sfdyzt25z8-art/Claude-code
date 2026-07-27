export interface RevenueEntry {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  source: string;
  date: string;
}

export interface ExpenseEntry {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  currency: string;
  period: "weekly" | "monthly" | "yearly";
}

export interface BusinessGoal {
  id: string;
  userId: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  dueDate: string | null;
  completed: boolean;
}

export interface InvestmentEntry {
  id: string;
  userId: string;
  name: string;
  amount: number;
  currency: string;
  currentValue: number;
  purchaseDate: string;
}

export interface MarketingPlanItem {
  id: string;
  userId: string;
  title: string;
  channel: string;
  scheduledDate: string;
  status: "planned" | "in_progress" | "done";
  notes: string | null;
}

export type AcademyKey =
  | "marketing"
  | "branding"
  | "sales"
  | "leadership"
  | "investing"
  | "app_development_replit"
  | "ai_app_development";

export interface AcademyModule {
  id: string;
  academy: AcademyKey;
  title: string;
  summary: string;
  order: number;
}

export interface AcademyProgress {
  userId: string;
  academy: AcademyKey;
  moduleId: string;
  completed: boolean;
  completedAt: string | null;
}

export const ACADEMIES: AcademyKey[] = [
  "marketing",
  "branding",
  "sales",
  "leadership",
  "investing",
  "app_development_replit",
  "ai_app_development",
];

/** Career-track dashboard for users who do not own a business. */
export interface CareerGoal {
  id: string;
  userId: string;
  title: string;
  category:
    | "career_planning"
    | "productivity"
    | "time_management"
    | "professional_development"
    | "leadership"
    | "goal_tracking";
  targetDate: string | null;
  completed: boolean;
}

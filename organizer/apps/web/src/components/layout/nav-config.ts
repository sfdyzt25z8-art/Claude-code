import type { AppMode } from "@organizer/shared";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  CalendarClock,
  Timer as TimerIcon,
  Gamepad2,
  LineChart,
  GraduationCap,
  BarChart3,
  Wallet,
  PiggyBank,
  Target,
  TrendingUp,
  Megaphone,
  Landmark,
  MessageCircleHeart,
  ListChecks,
  Flame,
  Activity,
  Bot,
  Calendar,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const commonNavTop: NavItem[] = [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }];

export const modeNavItems: Record<AppMode, NavItem[]> = {
  student: [
    { href: "/student/homework", label: "Homework", icon: ClipboardList },
    { href: "/student/gradebook", label: "Gradebook", icon: BarChart3 },
    { href: "/student/planner", label: "Planner", icon: CalendarClock },
    { href: "/student/exams", label: "Exams", icon: GraduationCap },
    { href: "/student/quizzes", label: "Quizzes", icon: ListChecks },
    { href: "/student/reading", label: "Reading", icon: BookOpen },
    { href: "/student/timer", label: "Study Timer", icon: TimerIcon },
    { href: "/student/mini-games", label: "Mini-Games", icon: Gamepad2 },
    { href: "/student/progress", label: "Progress", icon: LineChart },
  ],
  business: [
    { href: "/business/overview", label: "Overview", icon: LayoutDashboard },
    { href: "/business/finances", label: "Finances", icon: Wallet },
    { href: "/business/budget", label: "Budget", icon: PiggyBank },
    { href: "/business/goals", label: "Goals", icon: Target },
    { href: "/business/investments", label: "Investments", icon: TrendingUp },
    { href: "/business/marketing", label: "Marketing", icon: Megaphone },
    { href: "/business/academies", label: "Academies", icon: Landmark },
    { href: "/business/coach", label: "AI Coach", icon: MessageCircleHeart },
  ],
  personal: [
    { href: "/personal/goals", label: "Goals", icon: Target },
    { href: "/personal/habits", label: "Habits", icon: Flame },
    { href: "/personal/progress", label: "Progress", icon: Activity },
  ],
};

export const commonNavBottom: NavItem[] = [
  { href: "/ai", label: "AI Assistant", icon: Bot },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

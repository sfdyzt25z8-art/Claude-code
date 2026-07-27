import type { NavigatorScreenParams } from "@react-navigation/native";
import type { Quiz } from "@organizer/shared";

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type StudentStackParamList = {
  StudentDashboard: undefined;
  Homework: undefined;
  Exams: undefined;
  Gradebook: undefined;
  QuizSubjectPicker: undefined;
  QuizPlay: { quiz: Quiz };
  QuizResult: { quizId: string; score: number; totalQuestions: number };
};

export type BusinessStackParamList = {
  BusinessDashboard: undefined;
  Finances: undefined;
  Budgets: undefined;
  BusinessGoals: undefined;
};

export type PersonalStackParamList = {
  PersonalDashboard: undefined;
  PersonalGoals: undefined;
  Habits: undefined;
  Progress: undefined;
};

export type DashboardStackParamList = StudentStackParamList &
  BusinessStackParamList &
  PersonalStackParamList;

export type MainTabParamList = {
  DashboardTab: NavigatorScreenParams<DashboardStackParamList>;
  CalendarTab: undefined;
  AiAssistantTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
};

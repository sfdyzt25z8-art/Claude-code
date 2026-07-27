import type { NavigatorScreenParams } from "@react-navigation/native";

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
  QuizPlay: { subject: string; quizId: string };
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

export type DashboardStackParamList = {
  DashboardHome: undefined;
} & StudentStackParamList &
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

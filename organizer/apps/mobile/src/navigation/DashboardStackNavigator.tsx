import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { DashboardStackParamList } from "./types";
import { useTheme } from "../theme/ThemeContext";

import { StudentDashboardScreen } from "../screens/student/StudentDashboardScreen";
import { HomeworkScreen } from "../screens/student/HomeworkScreen";
import { ExamsScreen } from "../screens/student/ExamsScreen";
import { GradebookScreen } from "../screens/student/GradebookScreen";
import { QuizSubjectPickerScreen } from "../screens/student/QuizSubjectPickerScreen";
import { QuizPlayScreen } from "../screens/student/QuizPlayScreen";
import { QuizResultScreen } from "../screens/student/QuizResultScreen";

import { BusinessDashboardScreen } from "../screens/business/BusinessDashboardScreen";
import { FinancesScreen } from "../screens/business/FinancesScreen";
import { BudgetsScreen } from "../screens/business/BudgetsScreen";
import { BusinessGoalsScreen } from "../screens/business/BusinessGoalsScreen";

import { PersonalDashboardScreen } from "../screens/personal/PersonalDashboardScreen";
import { PersonalGoalsScreen } from "../screens/personal/PersonalGoalsScreen";
import { HabitsScreen } from "../screens/personal/HabitsScreen";
import { ProgressScreen } from "../screens/personal/ProgressScreen";

const Stack = createNativeStackNavigator<DashboardStackParamList>();

/**
 * A single stack navigator that hosts all three modes' screens. Only the
 * screens for the user's current mode are ever navigated to (the initial
 * route is chosen by mode below), but keeping every screen registered
 * avoids having to remount the whole navigator (and lose back-stack state)
 * every time `mode` is read from context.
 */
export function DashboardStackNavigator() {
  const { theme, mode } = useTheme();

  const initialRouteName: keyof DashboardStackParamList =
    mode === "business" ? "BusinessDashboard" : mode === "personal" ? "PersonalDashboard" : "StudentDashboard";

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: { color: theme.colors.textPrimary },
      }}
    >
      {/* Student */}
      <Stack.Screen name="StudentDashboard" component={StudentDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Homework" component={HomeworkScreen} options={{ title: "Homework" }} />
      <Stack.Screen name="Exams" component={ExamsScreen} options={{ title: "Exams" }} />
      <Stack.Screen name="Gradebook" component={GradebookScreen} options={{ title: "Gradebook" }} />
      <Stack.Screen name="QuizSubjectPicker" component={QuizSubjectPickerScreen} options={{ title: "Quiz" }} />
      <Stack.Screen name="QuizPlay" component={QuizPlayScreen} options={{ title: "Quiz" }} />
      <Stack.Screen name="QuizResult" component={QuizResultScreen} options={{ title: "Results", headerBackVisible: false }} />

      {/* Business */}
      <Stack.Screen name="BusinessDashboard" component={BusinessDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Finances" component={FinancesScreen} options={{ title: "Finances" }} />
      <Stack.Screen name="Budgets" component={BudgetsScreen} options={{ title: "Budgets" }} />
      <Stack.Screen name="BusinessGoals" component={BusinessGoalsScreen} options={{ title: "Goals" }} />

      {/* Personal */}
      <Stack.Screen name="PersonalDashboard" component={PersonalDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PersonalGoals" component={PersonalGoalsScreen} options={{ title: "Goals" }} />
      <Stack.Screen name="Habits" component={HabitsScreen} options={{ title: "Habits" }} />
      <Stack.Screen name="Progress" component={ProgressScreen} options={{ title: "Progress" }} />
    </Stack.Navigator>
  );
}

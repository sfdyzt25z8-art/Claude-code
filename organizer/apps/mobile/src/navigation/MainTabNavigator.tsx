import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "./types";
import { useTheme } from "../theme/ThemeContext";
import { DashboardStackNavigator } from "./DashboardStackNavigator";
import { CalendarScreen } from "../screens/calendar/CalendarScreen";
import { AiAssistantScreen } from "../screens/ai/AiAssistantScreen";
import { SettingsScreen } from "../screens/settings/SettingsScreen";

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  DashboardTab: "🏠",
  CalendarTab: "📅",
  AiAssistantTab: "✨",
  SettingsTab: "⚙️",
};

export function MainTabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{TAB_ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardStackNavigator} options={{ title: "Dashboard" }} />
      <Tab.Screen name="CalendarTab" component={CalendarScreen} options={{ title: "Calendar" }} />
      <Tab.Screen name="AiAssistantTab" component={AiAssistantScreen} options={{ title: "AI Assistant" }} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ title: "Settings" }} />
    </Tab.Navigator>
  );
}

import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";
import { useAuth } from "../lib/auth-context";
import { useTheme } from "../theme/ThemeContext";
import { AuthNavigator } from "./AuthNavigator";
import { MainTabNavigator } from "./MainTabNavigator";
import { OnboardingScreen } from "../screens/onboarding/OnboardingScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Top-level switch: Auth stack (signed out) -> Onboarding (signed in, no
 * completed profile) -> Main tabs (signed in + onboarded).
 */
export function RootNavigator() {
  const { firebaseUser, profile, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!firebaseUser ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : !profile?.onboardingCompleted ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

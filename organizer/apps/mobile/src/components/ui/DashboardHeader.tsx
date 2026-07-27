import React from "react";
import { StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../theme/ThemeContext";

interface DashboardHeaderProps {
  greeting: string;
}

/**
 * Mode-colored gradient banner shown at the top of each dashboard, using
 * the same `theme.gradient` tuple @organizer/shared defines for the web
 * app's background treatment, plus the mode's motivational copy.
 */
export function DashboardHeader({ greeting }: DashboardHeaderProps) {
  const { theme } = useTheme();

  return (
    <LinearGradient
      colors={theme.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.banner}
    >
      <Text style={styles.greeting}>{greeting}</Text>
      <Text style={styles.motivation}>{theme.motivation}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  motivation: {
    fontSize: 14,
    color: "#FFFFFFDD",
    marginTop: 6,
    fontStyle: "italic",
  },
});

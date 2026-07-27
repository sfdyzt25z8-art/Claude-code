import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

interface BadgeProps {
  label: string;
  tone?: "accent" | "success" | "danger" | "neutral";
}

export function Badge({ label, tone = "accent" }: BadgeProps) {
  const { theme } = useTheme();

  const backgroundColor =
    tone === "success"
      ? "#16A34A22"
      : tone === "danger"
        ? "#DC262622"
        : tone === "neutral"
          ? theme.colors.border
          : `${theme.colors.accent}33`;
  const textColor =
    tone === "success" ? "#16A34A" : tone === "danger" ? "#DC2626" : theme.colors.accent;

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
});

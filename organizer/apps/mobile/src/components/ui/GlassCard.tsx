import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "../../theme/ThemeContext";

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}

/** Theme-aware glassmorphism card using expo-blur's BlurView for a real blur effect. */
export function GlassCard({ children, style, intensity = 40 }: GlassCardProps) {
  const { theme } = useTheme();
  const isDark = theme.mode === "business";

  return (
    <View style={[styles.wrapper, { borderColor: theme.colors.border }, style]}>
      <BlurView
        intensity={intensity}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.overlay,
          { backgroundColor: theme.colors.surfaceGlass },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  overlay: {
    padding: 16,
  },
});

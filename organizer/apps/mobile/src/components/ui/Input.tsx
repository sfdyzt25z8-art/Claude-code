import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  /**
   * Layout styles (flex, margin, width…) for the outer wrapper - e.g. so two
   * Inputs can sit side by side in a row with `{ flex: 1 }`. `style` is
   * reserved for the inner TextInput's own visual styling.
   */
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({ label, error, style, containerStyle, ...rest }: InputProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={theme.colors.textSecondary}
        style={[
          styles.input,
          {
            borderColor: error ? "#DC2626" : theme.colors.border,
            color: theme.colors.textPrimary,
            backgroundColor: theme.colors.surface,
          },
          style,
        ]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 4,
  },
});

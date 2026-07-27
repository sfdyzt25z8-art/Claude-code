import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../../lib/auth-context";
import { useTheme } from "../../theme/ThemeContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Reset your password</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          We'll email you a link to reset your password.
        </Text>

        <Input
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {sent ? (
          <Text style={[styles.success, { color: theme.colors.textPrimary }]}>
            Check your inbox for a reset link.
          </Text>
        ) : null}

        <Button title="Send reset link" onPress={handleReset} loading={loading} style={styles.button} />
        <Button
          title="Back to log in"
          variant="outline"
          onPress={() => navigation.navigate("Login")}
          style={styles.button}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 24, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", marginTop: 6, marginBottom: 28 },
  button: { marginTop: 12 },
  error: { color: "#DC2626", marginBottom: 8, textAlign: "center" },
  success: { textAlign: "center", marginBottom: 8, fontWeight: "600" },
});

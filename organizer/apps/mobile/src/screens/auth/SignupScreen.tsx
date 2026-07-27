import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../../lib/auth-context";
import { useTheme } from "../../theme/ThemeContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Signup">;

export function SignupScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), password);
      // onAuthStateChanged in AuthProvider picks up the new session; the
      // RootNavigator will then route to Onboarding since profile is null.
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
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Create your account</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Set up Organizer for student, business, or personal life.
        </Text>

        <Input
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
        />
        <Input label="Password" secureTextEntry value={password} onChangeText={setPassword} />
        <Input
          label="Confirm password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title="Sign up" onPress={handleSignup} loading={loading} style={styles.button} />
        <Button
          title="Already have an account? Log in"
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
  title: { fontSize: 26, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", marginTop: 6, marginBottom: 28 },
  button: { marginTop: 12 },
  error: { color: "#DC2626", marginBottom: 8, textAlign: "center" },
});

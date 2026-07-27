import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "../../lib/auth-context";
import { useTheme } from "../../theme/ThemeContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { AuthStackParamList } from "../../navigation/types";

WebBrowser.maybeCompleteAuthSession();

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { signIn, signInWithGoogleCredential, signInWithApple } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [, googleResponse, promptGoogleSignIn] = Google.useAuthRequest({
    // These must be set to real OAuth client IDs (from Firebase console ->
    // Authentication -> Sign-in method -> Google -> Web SDK configuration)
    // via env vars before Google sign-in will work end-to-end.
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  React.useEffect(() => {
    if (googleResponse?.type === "success" && googleResponse.authentication) {
      signInWithGoogleCredential(
        googleResponse.authentication.idToken ?? "",
        googleResponse.authentication.accessToken,
      ).catch((e) => setError(e.message));
    }
  }, [googleResponse]);

  async function handleLogin() {
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
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
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Organizer</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Your AI-powered life operating system
        </Text>

        <Input
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title="Log in" onPress={handleLogin} loading={loading} style={styles.button} />

        <Button
          title="Continue with Google"
          variant="outline"
          onPress={() => promptGoogleSignIn()}
          style={styles.button}
        />

        {Platform.OS === "ios" ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={14}
            style={styles.appleButton}
            onPress={() => signInWithApple().catch((e) => setError(e.message))}
          />
        ) : null}

        <Button
          title="Forgot password?"
          variant="outline"
          onPress={() => navigation.navigate("ForgotPassword")}
          style={styles.button}
        />
        <Button
          title="Create an account"
          variant="secondary"
          onPress={() => navigation.navigate("Signup")}
          style={styles.button}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 32, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 15, textAlign: "center", marginTop: 6, marginBottom: 32 },
  button: { marginTop: 12 },
  appleButton: { height: 48, marginTop: 12 },
  error: { color: "#DC2626", marginBottom: 8, textAlign: "center" },
});

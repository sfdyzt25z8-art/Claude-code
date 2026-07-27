import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SUPPORTED_LANGUAGES, type AppMode, type UserProfile } from "@organizer/shared";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../../lib/auth-context";
import { apiPatch } from "../../lib/api";
import { registerForPushNotificationsAsync } from "../../lib/notifications";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { TutorialOverlay, type TutorialStep } from "../../components/tutorial/TutorialOverlay";

const MODES: AppMode[] = ["student", "business", "personal"];

const TUTORIAL_STEPS: TutorialStep[] = [
  { title: "Welcome to Organizer", body: "One app that adapts to student, business, or personal life." },
  { title: "Your Dashboard", body: "The Dashboard tab shows a summary and quick links to everything relevant to your mode." },
  { title: "AI Assistant", body: "Ask the AI Assistant tab anything - it remembers context across your conversation." },
  { title: "Calendar", body: "The Calendar tab groups your homework, exams, and goals by day." },
  { title: "Switch modes anytime", body: "Come back to Settings to switch between Student, Business, and Personal modes." },
];

export function SettingsScreen() {
  const { theme, mode, overrideMode } = useTheme();
  const { profile, refreshProfile, signOutUser } = useAuth();

  const [name, setName] = useState(profile?.name ?? "");
  const [country, setCountry] = useState(profile?.country ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [notifStatus, setNotifStatus] = useState<string | null>(null);

  useEffect(() => {
    setName(profile?.name ?? "");
    setCountry(profile?.country ?? "");
  }, [profile?.name, profile?.country]);

  async function saveProfile(patch: Partial<UserProfile>) {
    setSaving(true);
    setError(null);
    try {
      await apiPatch<UserProfile>("/api/profile", patch);
      await refreshProfile();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDetails() {
    await saveProfile({ name: name.trim(), country: country.trim() });
  }

  async function handleModeChange(nextMode: AppMode) {
    overrideMode(nextMode);
    await saveProfile({ mode: nextMode });
  }

  async function handleLanguageChange(code: string) {
    await saveProfile({ language: code });
  }

  async function handleEnableNotifications() {
    const token = await registerForPushNotificationsAsync();
    setNotifStatus(token ? "Push notifications enabled." : "Permission denied or unsupported on this device.");
  }

  async function handleTutorialComplete() {
    setShowTutorial(false);
    await saveProfile({ tutorialCompleted: true });
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Settings</Text>

      <GlassCard style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Profile</Text>
        <Input label="Name" value={name} onChangeText={setName} />
        <Input label="Country" value={country} onChangeText={setCountry} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Save changes" onPress={handleSaveDetails} loading={saving} />
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Mode</Text>
        <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>
          Switch how Organizer looks and what it tracks for you.
        </Text>
        <View style={styles.chipRow}>
          {MODES.map((m) => (
            <Pressable
              key={m}
              onPress={() => handleModeChange(m)}
              style={[
                styles.chip,
                {
                  backgroundColor: mode === m ? theme.colors.accent : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={{ color: mode === m ? "#0B0F19" : theme.colors.textPrimary, fontWeight: "700" }}>
                {m}
              </Text>
            </Pressable>
          ))}
        </View>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Language</Text>
        <View style={styles.chipRow}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Pressable
              key={lang.code}
              onPress={() => handleLanguageChange(lang.code)}
              style={[
                styles.chip,
                {
                  backgroundColor: profile?.language === lang.code ? theme.colors.accent : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: profile?.language === lang.code ? "#0B0F19" : theme.colors.textPrimary,
                  fontWeight: "600",
                }}
              >
                {lang.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Notifications</Text>
        <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>
          Enable push notifications for reminders about homework, exams, and goals.
        </Text>
        {notifStatus ? (
          <Text style={{ color: theme.colors.textSecondary, marginBottom: 8 }}>{notifStatus}</Text>
        ) : null}
        <Button title="Enable notifications" variant="outline" onPress={handleEnableNotifications} />
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Tutorial Center</Text>
        <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>
          {profile?.tutorialCompleted
            ? "You've completed the tutorial - replay it anytime."
            : "New here? Take a quick tour of Organizer."}
        </Text>
        <Button title="Open tutorial" variant="outline" onPress={() => setShowTutorial(true)} />
      </GlassCard>

      <Button title="Sign out" variant="secondary" onPress={signOutUser} style={styles.signOutButton} />

      <TutorialOverlay
        visible={showTutorial}
        steps={TUTORIAL_STEPS}
        onComplete={handleTutorialComplete}
        onSkip={handleTutorialComplete}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, paddingBottom: 60, gap: 16 },
  title: { fontSize: 26, fontWeight: "800" },
  card: { marginBottom: 4 },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, textTransform: "capitalize" },
  signOutButton: { marginTop: 8 },
  error: { color: "#DC2626", marginBottom: 8 },
});

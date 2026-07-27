import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  SUPPORTED_LANGUAGES,
  PERSONAL_FOCUS_OPTIONS,
  currencyForCountry,
  type AppMode,
  type PersonalFocus,
  type OnboardingInput,
} from "@organizer/shared";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../../lib/auth-context";
import { apiPost } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

const MODE_OPTIONS: { value: AppMode; label: string; description: string }[] = [
  { value: "student", label: "Student", description: "Homework, exams, quizzes, study planning." },
  { value: "business", label: "Business", description: "Revenue, budgets, goals, coaching." },
  { value: "personal", label: "Personal", description: "Habits, goals, wellbeing progress." },
];

const FOCUS_LABELS: Record<PersonalFocus, string> = {
  lose_weight: "Lose weight",
  gain_muscle: "Gain muscle",
  fitness: "Fitness",
  productivity: "Productivity",
  habits: "Habits",
  reading: "Reading",
  mental_wellness: "Mental wellness",
  learning_skills: "Learning skills",
};

const TOTAL_STEPS = 4;

export function OnboardingScreen() {
  const { theme } = useTheme();
  const { refreshProfile } = useAuth();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [language, setLanguage] = useState("en");
  const [mode, setMode] = useState<AppMode | null>(null);
  const [ownsBusiness, setOwnsBusiness] = useState<boolean | null>(null);
  const [personalFocus, setPersonalFocus] = useState<PersonalFocus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleFocus(focus: PersonalFocus) {
    setPersonalFocus((prev) =>
      prev.includes(focus) ? prev.filter((f) => f !== focus) : [...prev, focus],
    );
  }

  function canAdvance(): boolean {
    if (step === 0) return name.trim().length > 0 && Number(age) > 0;
    if (step === 1) return country.trim().length > 0 && countryCode.trim().length === 2;
    if (step === 2) return mode !== null;
    if (step === 3) {
      if (mode === "business") return ownsBusiness !== null;
      if (mode === "personal") return personalFocus.length > 0;
      return true;
    }
    return true;
  }

  async function handleSubmit() {
    if (!mode) return;
    setError(null);
    setSubmitting(true);
    try {
      const input: OnboardingInput = {
        name: name.trim(),
        age: Number(age),
        country: country.trim(),
        countryCode: countryCode.trim().toUpperCase(),
        language,
        mode,
        ...(mode === "business" ? { ownsBusiness: ownsBusiness ?? false } : {}),
        ...(mode === "personal" ? { personalFocus } : {}),
      };
      await apiPost("/api/onboarding", input);
      await refreshProfile();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        Welcome to Organizer
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Step {step + 1} of {TOTAL_STEPS}
      </Text>

      {step === 0 ? (
        <View>
          <Input label="What's your name?" value={name} onChangeText={setName} placeholder="Jane Doe" />
          <Input
            label="How old are you?"
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            placeholder="21"
          />
        </View>
      ) : null}

      {step === 1 ? (
        <View>
          <Input label="Where are you based?" value={country} onChangeText={setCountry} placeholder="United States" />
          <Input
            label="Country code (ISO-2, e.g. US)"
            value={countryCode}
            onChangeText={(v) => setCountryCode(v.toUpperCase())}
            autoCapitalize="characters"
            maxLength={2}
            placeholder="US"
          />
          <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
            Currency will default to {currencyForCountry(countryCode || "US")}.
          </Text>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Preferred language</Text>
          <View style={styles.chipRow}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                onPress={() => setLanguage(lang.code)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: language === lang.code ? theme.colors.accent : theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: language === lang.code ? "#0B0F19" : theme.colors.textPrimary,
                    fontWeight: "600",
                  }}
                >
                  {lang.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {step === 2 ? (
        <View>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            How do you want to use Organizer?
          </Text>
          {MODE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setMode(option.value)}
              style={[
                styles.modeCard,
                {
                  borderColor: mode === option.value ? theme.colors.accent : theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <Text style={[styles.modeTitle, { color: theme.colors.textPrimary }]}>{option.label}</Text>
              <Text style={{ color: theme.colors.textSecondary }}>{option.description}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {step === 3 ? (
        <View>
          {mode === "business" ? (
            <View>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Do you own a business?</Text>
              <View style={styles.chipRow}>
                {[
                  { value: true, label: "Yes, I own a business" },
                  { value: false, label: "No, I'm an employee" },
                ].map((opt) => (
                  <Pressable
                    key={String(opt.value)}
                    onPress={() => setOwnsBusiness(opt.value)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: ownsBusiness === opt.value ? theme.colors.accent : theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: ownsBusiness === opt.value ? "#0B0F19" : theme.colors.textPrimary,
                        fontWeight: "600",
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {mode === "personal" ? (
            <View>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                What do you want to focus on? (select all that apply)
              </Text>
              <View style={styles.chipRow}>
                {PERSONAL_FOCUS_OPTIONS.map((focus) => (
                  <Pressable
                    key={focus}
                    onPress={() => toggleFocus(focus)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: personalFocus.includes(focus)
                          ? theme.colors.accent
                          : theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: personalFocus.includes(focus) ? "#0B0F19" : theme.colors.textPrimary,
                        fontWeight: "600",
                      }}
                    >
                      {FOCUS_LABELS[focus]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {mode === "student" ? (
            <Text style={{ color: theme.colors.textSecondary }}>
              You're all set - tap Finish to build your student dashboard.
            </Text>
          ) : null}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        {step > 0 ? (
          <Button title="Back" variant="outline" onPress={() => setStep((s) => s - 1)} style={styles.backButton} />
        ) : null}
        <Button
          title={step === TOTAL_STEPS - 1 ? "Finish" : "Continue"}
          onPress={handleNext}
          disabled={!canAdvance()}
          loading={submitting}
          style={styles.nextButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 64 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 28 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 10, marginTop: 8 },
  hint: { fontSize: 12, marginBottom: 12 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, marginBottom: 8 },
  modeCard: { borderWidth: 1.5, borderRadius: 16, padding: 16, marginBottom: 12 },
  modeTitle: { fontSize: 17, fontWeight: "700", marginBottom: 4 },
  error: { color: "#DC2626", marginTop: 12, textAlign: "center" },
  actions: { flexDirection: "row", gap: 12, marginTop: 32 },
  backButton: { flex: 1 },
  nextButton: { flex: 2 },
});

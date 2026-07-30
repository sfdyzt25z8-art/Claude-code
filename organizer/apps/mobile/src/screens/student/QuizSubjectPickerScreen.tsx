import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SUBJECTS, type Quiz, type Subject } from "@organizer/shared";
import { useTheme } from "../../theme/ThemeContext";
import { apiPost } from "../../lib/api";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import type { DashboardStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<DashboardStackParamList, "QuizSubjectPicker">;

export function QuizSubjectPickerScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const [loadingSubject, setLoadingSubject] = useState<Subject | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startQuiz(subject: Subject) {
    setLoadingSubject(subject);
    setError(null);
    try {
      const { quiz } = await apiPost<{ quiz: Quiz }>("/api/student/quizzes", { subject });
      navigation.navigate("QuizPlay", { quiz });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingSubject(null);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Pick a subject</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        We'll generate a 15-question quiz and score it instantly.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {SUBJECTS.map((subject) => (
        <GlassCard key={subject} style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={[styles.subjectTitle, { color: theme.colors.textPrimary }]}>
              {subject.replace("_", " ")}
            </Text>
            <Button
              title="Start quiz"
              onPress={() => startQuiz(subject)}
              loading={loadingSubject === subject}
              disabled={loadingSubject !== null}
            />
          </View>
        </GlassCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 24, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  card: { marginBottom: 12 },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  subjectTitle: { fontSize: 17, fontWeight: "700", textTransform: "capitalize" },
  error: { color: "#DC2626", marginBottom: 12 },
});

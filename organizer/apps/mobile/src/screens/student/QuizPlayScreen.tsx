import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { QuizAttempt } from "@organizer/shared";
import { useTheme } from "../../theme/ThemeContext";
import { apiPost } from "../../lib/api";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/ProgressBar";
import type { DashboardStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<DashboardStackParamList, "QuizPlay">;

export function QuizPlayScreen({ route, navigation }: Props) {
  const { quiz } = route.params;
  const { theme } = useTheme();
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(quiz.questions.length).fill(null),
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question = quiz.questions[questionIndex];
  const isLast = questionIndex === quiz.questions.length - 1;
  const selected = answers[questionIndex];

  function selectChoice(choiceIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = choiceIndex;
      return next;
    });
  }

  async function handleNext() {
    if (!isLast) {
      setQuestionIndex((i) => i + 1);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const finalAnswers = answers.map((a) => a ?? -1);
      const attempt = await apiPost<QuizAttempt>(`/api/student/quizzes/${quiz.id}/attempts`, {
        answers: finalAnswers,
      });
      navigation.replace("QuizResult", {
        quizId: quiz.id,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
        Question {questionIndex + 1} of {quiz.questions.length}
      </Text>
      <ProgressBar progress={(questionIndex + 1) / quiz.questions.length} />

      <GlassCard style={styles.questionCard}>
        <Text style={[styles.questionText, { color: theme.colors.textPrimary }]}>
          {question.prompt}
        </Text>
        {question.choices.map((choice, index) => (
          <Pressable
            key={index}
            onPress={() => selectChoice(index)}
            style={[
              styles.choice,
              {
                borderColor: selected === index ? theme.colors.accent : theme.colors.border,
                backgroundColor: selected === index ? `${theme.colors.accent}22` : theme.colors.surface,
              },
            ]}
          >
            <Text style={{ color: theme.colors.textPrimary }}>{choice}</Text>
          </Pressable>
        ))}
      </GlassCard>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        {questionIndex > 0 ? (
          <Button
            title="Previous"
            variant="outline"
            onPress={() => setQuestionIndex((i) => i - 1)}
            style={styles.prevButton}
          />
        ) : null}
        <Button
          title={isLast ? "Submit quiz" : "Next"}
          onPress={handleNext}
          disabled={selected === null}
          loading={submitting}
          style={styles.nextButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 24, paddingBottom: 40 },
  progressLabel: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  questionCard: { marginTop: 20, marginBottom: 20 },
  questionText: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  choice: { borderWidth: 1.5, borderRadius: 12, padding: 14, marginBottom: 10 },
  actions: { flexDirection: "row", gap: 12 },
  prevButton: { flex: 1 },
  nextButton: { flex: 2 },
  error: { color: "#DC2626", marginBottom: 12, textAlign: "center" },
});

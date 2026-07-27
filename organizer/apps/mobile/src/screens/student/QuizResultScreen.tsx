import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTheme } from "../../theme/ThemeContext";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import type { DashboardStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<DashboardStackParamList, "QuizResult">;

export function QuizResultScreen({ route, navigation }: Props) {
  const { score, totalQuestions } = route.params;
  const { theme } = useTheme();
  const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
  const isPerfect = score === totalQuestions;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GlassCard style={styles.card}>
        <Text style={[styles.emoji]}>{isPerfect ? "🏆" : percentage >= 60 ? "🎉" : "📘"}</Text>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          {isPerfect ? "Perfect score!" : "Quiz complete"}
        </Text>
        <Text style={[styles.score, { color: theme.colors.accent }]}>
          {score} / {totalQuestions}
        </Text>
        <Text style={{ color: theme.colors.textSecondary, marginBottom: 24 }}>
          {percentage.toFixed(0)}% correct
        </Text>
        <Button
          title="Take another quiz"
          onPress={() => navigation.replace("QuizSubjectPicker")}
          style={styles.button}
        />
        <Button
          title="Back to dashboard"
          variant="outline"
          onPress={() => navigation.navigate("StudentDashboard")}
          style={styles.button}
        />
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  card: { alignItems: "center", padding: 24 },
  emoji: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 8 },
  score: { fontSize: 42, fontWeight: "800", marginBottom: 4 },
  button: { width: "100%", marginTop: 10 },
});

import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { differenceInCalendarDays, parseISO } from "date-fns";
import type { Homework, Exam } from "@organizer/shared";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../../lib/auth-context";
import { apiGet } from "../../lib/api";
import { GlassCard } from "../../components/ui/GlassCard";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { DashboardHeader } from "../../components/ui/DashboardHeader";
import type { DashboardStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<DashboardStackParamList, "StudentDashboard">;

export function StudentDashboardScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [homeworkData, examData] = await Promise.all([
        apiGet<Homework[]>("/api/student/homework"),
        apiGet<Exam[]>("/api/student/exams"),
      ]);
      setHomework(homeworkData);
      setExams(examData);
    } catch (e) {
      console.warn("Failed to load student dashboard", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const pendingHomework = homework.filter((h) => !h.completed);
  const nextExam = [...exams].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )[0];

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <DashboardHeader greeting={`Hi ${profile?.name?.split(" ")[0] ?? "there"} 👋`} />

      <GlassCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Homework</Text>
          <Badge label={`${pendingHomework.length} pending`} />
        </View>
        <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>
          {pendingHomework.length === 0
            ? "You're all caught up."
            : `Next up: ${pendingHomework[0]?.title}`}
        </Text>
        <Button title="Manage homework" onPress={() => navigation.navigate("Homework")} />
      </GlassCard>

      <GlassCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Exam countdown</Text>
        </View>
        {nextExam ? (
          <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>
            {nextExam.title} in{" "}
            {Math.max(0, differenceInCalendarDays(parseISO(nextExam.date), new Date()))} day(s)
          </Text>
        ) : (
          <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>
            No exams scheduled yet.
          </Text>
        )}
        <Button title="View exams" onPress={() => navigation.navigate("Exams")} />
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Quiz yourself</Text>
        <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>
          15-question quizzes across every subject, scored instantly.
        </Text>
        <Button title="Start a quiz" onPress={() => navigation.navigate("QuizSubjectPicker")} />
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Gradebook</Text>
        <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>
          Track assignment scores and your weighted average.
        </Text>
        <Button title="Open gradebook" onPress={() => navigation.navigate("Gradebook")} />
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, gap: 16 },
  card: { marginBottom: 4 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardTitle: { fontSize: 18, fontWeight: "700" },
});

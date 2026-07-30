import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { Habit, PersonalGoal } from "@organizer/shared";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../../lib/auth-context";
import { apiGet } from "../../lib/api";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { DashboardHeader } from "../../components/ui/DashboardHeader";
import type { DashboardStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<DashboardStackParamList, "PersonalDashboard">;

export function PersonalDashboardScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [habitData, goalData] = await Promise.all([
        apiGet<{ habits: Habit[] }>("/api/personal/habits"),
        apiGet<{ goals: PersonalGoal[] }>("/api/personal/goals"),
      ]);
      setHabits(habitData.habits.filter((h) => !h.archived));
      setGoals(goalData.goals);
    } catch (e) {
      console.warn("Failed to load personal dashboard", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const activeGoals = goals.filter((g) => !g.completed);

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <DashboardHeader greeting={`Hi ${profile?.name?.split(" ")[0] ?? "there"} 👋`} />

      <GlassCard style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Habits</Text>
        <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>
          {habits.length === 0 ? "No habits yet - start one today." : `${habits.length} habit(s) tracked`}
        </Text>
        <Button title="Check in today" onPress={() => navigation.navigate("Habits")} />
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Goals</Text>
        <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>
          {activeGoals.length === 0
            ? "No active goals yet."
            : `${activeGoals.length} active goal(s), next: ${activeGoals[0]?.title}`}
        </Text>
        <Button title="View goals" onPress={() => navigation.navigate("PersonalGoals")} />
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Progress</Text>
        <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>
          Log a quick check-in to track how you're feeling.
        </Text>
        <Button title="Log progress" onPress={() => navigation.navigate("Progress")} />
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, gap: 16 },
  card: { marginBottom: 4 },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
});

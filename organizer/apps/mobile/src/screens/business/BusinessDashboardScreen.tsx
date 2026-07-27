import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RevenueEntry, ExpenseEntry, BusinessGoal } from "@organizer/shared";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../../lib/auth-context";
import { apiGet } from "../../lib/api";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { DashboardHeader } from "../../components/ui/DashboardHeader";
import type { DashboardStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<DashboardStackParamList, "BusinessDashboard">;

export function BusinessDashboardScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const [revenue, setRevenue] = useState<RevenueEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [goals, setGoals] = useState<BusinessGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [revenueData, expenseData, goalData] = await Promise.all([
        apiGet<RevenueEntry[]>("/api/business/revenue"),
        apiGet<ExpenseEntry[]>("/api/business/expenses"),
        apiGet<BusinessGoal[]>("/api/business/goals"),
      ]);
      setRevenue(revenueData);
      setExpenses(expenseData);
      setGoals(goalData);
    } catch (e) {
      console.warn("Failed to load business dashboard", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const activeGoals = goals.filter((g) => !g.completed);

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <DashboardHeader greeting={profile?.name ? `${profile.name}'s business` : "Your business"} />

      <GlassCard style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Net profit</Text>
        <Text
          style={[
            styles.bigNumber,
            { color: netProfit >= 0 ? "#16A34A" : "#DC2626" },
          ]}
        >
          {profile?.currency ?? "USD"} {netProfit.toFixed(2)}
        </Text>
        <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>
          Revenue {totalRevenue.toFixed(2)} · Expenses {totalExpenses.toFixed(2)}
        </Text>
        <Button title="Manage finances" onPress={() => navigation.navigate("Finances")} />
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Budgets</Text>
        <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>
          Set spending limits per category and track them.
        </Text>
        <Button title="Open budgets" onPress={() => navigation.navigate("Budgets")} />
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Goals</Text>
        <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>
          {activeGoals.length === 0
            ? "No active goals - set one to stay focused."
            : `${activeGoals.length} active goal(s), next: ${activeGoals[0]?.title}`}
        </Text>
        <Button title="View goals" onPress={() => navigation.navigate("BusinessGoals")} />
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, gap: 16 },
  card: { marginBottom: 4 },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  bigNumber: { fontSize: 30, fontWeight: "800", marginBottom: 4 },
});

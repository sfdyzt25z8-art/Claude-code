import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import type { BusinessGoal } from "@organizer/shared";
import { useTheme } from "../../theme/ThemeContext";
import { apiGet, apiPatch, apiPost } from "../../lib/api";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Badge } from "../../components/ui/Badge";

export function BusinessGoalsScreen() {
  const { theme } = useTheme();
  const [goals, setGoals] = useState<BusinessGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<BusinessGoal[]>("/api/business/goals");
      setGoals(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd() {
    const targetNum = Number(targetValue);
    if (!title.trim() || Number.isNaN(targetNum) || targetNum <= 0) return;
    setSaving(true);
    setError(null);
    try {
      const created = await apiPost<BusinessGoal>("/api/business/goals", {
        title: title.trim(),
        targetValue: targetNum,
        currentValue: 0,
        unit: unit.trim() || "units",
        dueDate: null,
      });
      setGoals((prev) => [created, ...prev]);
      setTitle("");
      setTargetValue("");
      setUnit("");
      setShowForm(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function bumpProgress(goal: BusinessGoal) {
    const nextValue = Math.min(goal.targetValue, goal.currentValue + goal.targetValue * 0.1);
    const completed = nextValue >= goal.targetValue;
    const previous = goals;
    setGoals((prev) =>
      prev.map((g) => (g.id === goal.id ? { ...g, currentValue: nextValue, completed } : g)),
    );
    try {
      await apiPatch<BusinessGoal>(`/api/business/goals/${goal.id}`, {
        currentValue: nextValue,
        completed,
      });
    } catch (e) {
      setGoals(previous);
      setError((e as Error).message);
    }
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <FlatList
        contentContainerStyle={styles.list}
        data={goals}
        keyExtractor={(item) => item.id}
        onRefresh={load}
        refreshing={loading}
        ListHeaderComponent={
          <View>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Business goals</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {showForm ? (
              <GlassCard style={styles.formCard}>
                <Input label="Goal title" value={title} onChangeText={setTitle} placeholder="Reach $10k MRR" />
                <Input label="Target value" value={targetValue} onChangeText={setTargetValue} keyboardType="decimal-pad" placeholder="10000" />
                <Input label="Unit" value={unit} onChangeText={setUnit} placeholder="USD, customers, sales…" />
                <Button title="Save goal" onPress={handleAdd} loading={saving} style={styles.saveButton} />
              </GlassCard>
            ) : (
              <Button title="+ Add goal" onPress={() => setShowForm(true)} style={styles.addButton} />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <GlassCard style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={[styles.itemTitle, { color: theme.colors.textPrimary }]}>{item.title}</Text>
              <Badge label={item.completed ? "Done" : "Active"} tone={item.completed ? "success" : "accent"} />
            </View>
            <Text style={{ color: theme.colors.textSecondary, marginBottom: 8 }}>
              {item.currentValue.toFixed(0)} / {item.targetValue.toFixed(0)} {item.unit}
            </Text>
            <ProgressBar progress={item.targetValue > 0 ? item.currentValue / item.targetValue : 0} />
            {!item.completed ? (
              <Button
                title="Log +10% progress"
                variant="outline"
                onPress={() => bumpProgress(item)}
                style={styles.bumpButton}
              />
            ) : null}
          </GlassCard>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ color: theme.colors.textSecondary, textAlign: "center", marginTop: 24 }}>
              No business goals yet.
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 16 },
  formCard: { marginBottom: 16 },
  addButton: { marginBottom: 16 },
  saveButton: { marginTop: 4 },
  itemCard: { marginBottom: 12 },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  itemTitle: { fontSize: 16, fontWeight: "700", flex: 1, marginRight: 8 },
  bumpButton: { marginTop: 12 },
  error: { color: "#DC2626", marginBottom: 12 },
});

import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { PERSONAL_FOCUS_OPTIONS, type PersonalFocus, type PersonalGoal } from "@organizer/shared";
import { useTheme } from "../../theme/ThemeContext";
import { apiGet, apiPatch, apiPost } from "../../lib/api";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Badge } from "../../components/ui/Badge";

export function PersonalGoalsScreen() {
  const { theme } = useTheme();
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");
  const [focus, setFocus] = useState<PersonalFocus>(PERSONAL_FOCUS_OPTIONS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { goals: data } = await apiGet<{ goals: PersonalGoal[] }>("/api/personal/goals");
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
    const targetNum = targetValue ? Number(targetValue) : null;
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const { goal: created } = await apiPost<{ goal: PersonalGoal }>("/api/personal/goals", {
        focus,
        title: title.trim(),
        targetValue: targetNum,
        currentValue: targetNum !== null ? 0 : null,
        unit: unit.trim() || null,
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

  async function markComplete(goal: PersonalGoal) {
    const previous = goals;
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, completed: true } : g)));
    try {
      await apiPatch<PersonalGoal>(`/api/personal/goals/${goal.id}`, { completed: true });
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
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Personal goals</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {showForm ? (
              <GlassCard style={styles.formCard}>
                <Input label="Goal title" value={title} onChangeText={setTitle} placeholder="Read 12 books this year" />
                <Input label="Target value (optional)" value={targetValue} onChangeText={setTargetValue} keyboardType="decimal-pad" placeholder="12" />
                <Input label="Unit (optional)" value={unit} onChangeText={setUnit} placeholder="books, kg, minutes…" />
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Focus area</Text>
                <View style={styles.chipRow}>
                  {PERSONAL_FOCUS_OPTIONS.map((f) => (
                    <Pressable
                      key={f}
                      onPress={() => setFocus(f)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: focus === f ? theme.colors.accent : theme.colors.surface,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text style={{ color: focus === f ? "#0B0F19" : theme.colors.textPrimary }}>
                        {f.replace("_", " ")}
                      </Text>
                    </Pressable>
                  ))}
                </View>
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
              <Badge label={item.completed ? "Done" : item.focus.replace("_", " ")} tone={item.completed ? "success" : "accent"} />
            </View>
            {item.targetValue !== null && item.currentValue !== null ? (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ color: theme.colors.textSecondary, marginBottom: 6 }}>
                  {item.currentValue} / {item.targetValue} {item.unit ?? ""}
                </Text>
                <ProgressBar progress={item.targetValue > 0 ? item.currentValue / item.targetValue : 0} />
              </View>
            ) : null}
            {!item.completed ? (
              <Button title="Mark complete" variant="outline" onPress={() => markComplete(item)} style={styles.completeButton} />
            ) : null}
          </GlassCard>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ color: theme.colors.textSecondary, textAlign: "center", marginTop: 24 }}>
              No personal goals yet.
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
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8, marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  formCard: { marginBottom: 16 },
  addButton: { marginBottom: 16 },
  saveButton: { marginTop: 4 },
  itemCard: { marginBottom: 12 },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  itemTitle: { fontSize: 16, fontWeight: "700", flex: 1, marginRight: 8 },
  completeButton: { marginTop: 4 },
  error: { color: "#DC2626", marginBottom: 12 },
});

import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { format, parseISO } from "date-fns";
import { SUBJECTS, type GradeEntry, type Subject } from "@organizer/shared";
import { useTheme } from "../../theme/ThemeContext";
import { apiGet, apiPost } from "../../lib/api";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export function GradebookScreen() {
  const { theme } = useTheme();
  const [items, setItems] = useState<GradeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [assignmentName, setAssignmentName] = useState("");
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [weight, setWeight] = useState("1");
  const [subject, setSubject] = useState<Subject>("math");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { grades } = await apiGet<{ grades: GradeEntry[] }>("/api/student/grades");
      setItems(grades);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const weightedAverage = useMemo(() => {
    if (items.length === 0) return null;
    const totalWeight = items.reduce((sum, g) => sum + g.weight, 0);
    if (totalWeight === 0) return null;
    const weightedSum = items.reduce(
      (sum, g) => sum + (g.score / g.maxScore) * 100 * g.weight,
      0,
    );
    return weightedSum / totalWeight;
  }, [items]);

  async function handleAdd() {
    const scoreNum = Number(score);
    const maxScoreNum = Number(maxScore);
    const weightNum = Number(weight);
    if (!assignmentName.trim() || Number.isNaN(scoreNum) || Number.isNaN(maxScoreNum)) return;
    setSaving(true);
    setError(null);
    try {
      const { grade: created } = await apiPost<{ grade: GradeEntry }>("/api/student/grades", {
        subject,
        assignmentName: assignmentName.trim(),
        score: scoreNum,
        maxScore: maxScoreNum,
        weight: weightNum,
        date: new Date().toISOString(),
      });
      setItems((prev) => [created, ...prev]);
      setAssignmentName("");
      setScore("");
      setShowForm(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <FlatList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={(item) => item.id}
        onRefresh={load}
        refreshing={loading}
        ListHeaderComponent={
          <View>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Gradebook</Text>
            <GlassCard style={styles.summaryCard}>
              <Text style={{ color: theme.colors.textSecondary }}>Weighted average</Text>
              <Text style={[styles.average, { color: theme.colors.accent }]}>
                {weightedAverage !== null ? `${weightedAverage.toFixed(1)}%` : "—"}
              </Text>
            </GlassCard>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {showForm ? (
              <GlassCard style={styles.formCard}>
                <Input label="Assignment name" value={assignmentName} onChangeText={setAssignmentName} placeholder="Chapter 4 quiz" />
                <View style={styles.row}>
                  <Input label="Score" value={score} onChangeText={setScore} keyboardType="numeric" containerStyle={styles.rowInput} />
                  <Input label="Max score" value={maxScore} onChangeText={setMaxScore} keyboardType="numeric" containerStyle={styles.rowInput} />
                </View>
                <Input label="Weight" value={weight} onChangeText={setWeight} keyboardType="numeric" />
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Subject</Text>
                <View style={styles.chipRow}>
                  {SUBJECTS.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => setSubject(s)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: subject === s ? theme.colors.accent : theme.colors.surface,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text style={{ color: subject === s ? "#0B0F19" : theme.colors.textPrimary }}>
                        {s.replace("_", " ")}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Button title="Save grade" onPress={handleAdd} loading={saving} style={styles.saveButton} />
              </GlassCard>
            ) : (
              <Button title="+ Add grade" onPress={() => setShowForm(true)} style={styles.addButton} />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <GlassCard style={styles.itemCard}>
            <Text style={[styles.itemTitle, { color: theme.colors.textPrimary }]}>{item.assignmentName}</Text>
            <Text style={{ color: theme.colors.textSecondary }}>
              {item.subject.replace("_", " ")} · {item.score}/{item.maxScore} ({((item.score / item.maxScore) * 100).toFixed(0)}%) ·{" "}
              {format(parseISO(item.date), "MMM d")}
            </Text>
          </GlassCard>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ color: theme.colors.textSecondary, textAlign: "center", marginTop: 24 }}>
              No grades logged yet.
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
  summaryCard: { marginBottom: 16, alignItems: "center", paddingVertical: 20 },
  average: { fontSize: 36, fontWeight: "800", marginTop: 4 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8, marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  formCard: { marginBottom: 16 },
  addButton: { marginBottom: 16 },
  saveButton: { marginTop: 4 },
  row: { flexDirection: "row", gap: 12 },
  rowInput: { flex: 1 },
  itemCard: { marginBottom: 12 },
  itemTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  error: { color: "#DC2626", marginBottom: 12 },
});

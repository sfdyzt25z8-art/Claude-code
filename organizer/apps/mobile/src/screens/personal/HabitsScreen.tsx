import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { format } from "date-fns";
import { PERSONAL_FOCUS_OPTIONS, type Habit, type HabitLog, type PersonalFocus } from "@organizer/shared";
import { useTheme } from "../../theme/ThemeContext";
import { apiGet, apiPost } from "../../lib/api";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";

const FREQUENCIES: Habit["frequency"][] = ["daily", "weekly"];
const todayKey = format(new Date(), "yyyy-MM-dd");

export function HabitsScreen() {
  const { theme } = useTheme();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayLogs, setTodayLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState<Habit["frequency"]>("daily");
  const [targetCount, setTargetCount] = useState("1");
  const [focus, setFocus] = useState<PersonalFocus | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [habitData, logData] = await Promise.all([
        apiGet<Habit[]>("/api/personal/habits"),
        apiGet<HabitLog[]>("/api/personal/habits/logs", { date: todayKey }),
      ]);
      setHabits(habitData.filter((h) => !h.archived));
      setTodayLogs(logData);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const loggedHabitIds = useMemo(
    () => new Set(todayLogs.filter((l) => l.completed).map((l) => l.habitId)),
    [todayLogs],
  );

  async function handleAdd() {
    const targetNum = Number(targetCount);
    if (!title.trim() || Number.isNaN(targetNum) || targetNum <= 0) return;
    setSaving(true);
    setError(null);
    try {
      const created = await apiPost<Habit>("/api/personal/habits", {
        title: title.trim(),
        focus,
        frequency,
        targetCount: targetNum,
      });
      setHabits((prev) => [created, ...prev]);
      setTitle("");
      setTargetCount("1");
      setShowForm(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function checkIn(habit: Habit) {
    setCheckingInId(habit.id);
    setError(null);
    try {
      const log = await apiPost<HabitLog>(`/api/personal/habits/${habit.id}/logs`, {
        date: todayKey,
        completed: true,
      });
      setTodayLogs((prev) => [...prev.filter((l) => l.habitId !== habit.id), log]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCheckingInId(null);
    }
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <FlatList
        contentContainerStyle={styles.list}
        data={habits}
        keyExtractor={(item) => item.id}
        onRefresh={load}
        refreshing={loading}
        ListHeaderComponent={
          <View>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Habits</Text>
            <Text style={{ color: theme.colors.textSecondary, marginBottom: 16 }}>
              One tap to check in for today.
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {showForm ? (
              <GlassCard style={styles.formCard}>
                <Input label="Habit title" value={title} onChangeText={setTitle} placeholder="Drink 2L water" />
                <Input
                  label="Daily/weekly target count"
                  value={targetCount}
                  onChangeText={setTargetCount}
                  keyboardType="number-pad"
                  placeholder="1"
                />
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Frequency</Text>
                <View style={styles.chipRow}>
                  {FREQUENCIES.map((f) => (
                    <Pressable
                      key={f}
                      onPress={() => setFrequency(f)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: frequency === f ? theme.colors.accent : theme.colors.surface,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text style={{ color: frequency === f ? "#0B0F19" : theme.colors.textPrimary }}>{f}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Focus (optional)</Text>
                <View style={styles.chipRow}>
                  {PERSONAL_FOCUS_OPTIONS.map((f) => (
                    <Pressable
                      key={f}
                      onPress={() => setFocus((prev) => (prev === f ? null : f))}
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
                <Button title="Save habit" onPress={handleAdd} loading={saving} style={styles.saveButton} />
              </GlassCard>
            ) : (
              <Button title="+ Add habit" onPress={() => setShowForm(true)} style={styles.addButton} />
            )}
          </View>
        }
        renderItem={({ item }) => {
          const isLogged = loggedHabitIds.has(item.id);
          return (
            <GlassCard style={styles.itemCard}>
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemTitle, { color: theme.colors.textPrimary }]}>{item.title}</Text>
                  <Text style={{ color: theme.colors.textSecondary }}>
                    {item.frequency} · target {item.targetCount}
                    {item.focus ? ` · ${item.focus.replace("_", " ")}` : ""}
                  </Text>
                </View>
                {isLogged ? <Badge label="Done today" tone="success" /> : null}
              </View>
              <Button
                title={isLogged ? "Checked in ✓" : "Check in for today"}
                variant={isLogged ? "outline" : "primary"}
                disabled={isLogged}
                loading={checkingInId === item.id}
                onPress={() => checkIn(item)}
                style={styles.checkInButton}
              />
            </GlassCard>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ color: theme.colors.textSecondary, textAlign: "center", marginTop: 24 }}>
              No habits yet. Add your first one above.
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
  title: { fontSize: 24, fontWeight: "800", marginBottom: 4 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8, marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  formCard: { marginBottom: 16 },
  addButton: { marginBottom: 16 },
  saveButton: { marginTop: 4 },
  itemCard: { marginBottom: 12 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  itemInfo: { flex: 1, marginRight: 8 },
  itemTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  checkInButton: { marginTop: 0 },
  error: { color: "#DC2626", marginBottom: 12 },
});

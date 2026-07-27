import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { format, parseISO } from "date-fns";
import { PERSONAL_FOCUS_OPTIONS, type PersonalFocus, type ProgressCheckIn } from "@organizer/shared";
import { useTheme } from "../../theme/ThemeContext";
import { apiGet, apiPost } from "../../lib/api";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export function ProgressScreen() {
  const { theme } = useTheme();
  const [checkIns, setCheckIns] = useState<ProgressCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [focus, setFocus] = useState<PersonalFocus>(PERSONAL_FOCUS_OPTIONS[0]);
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<ProgressCheckIn[]>("/api/personal/progress-checkins");
      setCheckIns(
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      );
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
    const valueNum = Number(value);
    if (Number.isNaN(valueNum)) return;
    setSaving(true);
    setError(null);
    try {
      const created = await apiPost<ProgressCheckIn>("/api/personal/progress-checkins", {
        focus,
        date: new Date().toISOString(),
        value: valueNum,
        note: note.trim() || null,
      });
      setCheckIns((prev) => [created, ...prev]);
      setValue("");
      setNote("");
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
        data={checkIns}
        keyExtractor={(item) => item.id}
        onRefresh={load}
        refreshing={loading}
        ListHeaderComponent={
          <View>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Progress check-ins</Text>
            <Text style={{ color: theme.colors.textSecondary, marginBottom: 16 }}>
              Log a quick number (e.g. weight, mood 1-10, pages read) to see trends over time.
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {showForm ? (
              <GlassCard style={styles.formCard}>
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
                <Input label="Value" value={value} onChangeText={setValue} keyboardType="decimal-pad" placeholder="e.g. 72.5" />
                <Input label="Note (optional)" value={note} onChangeText={setNote} placeholder="Feeling good today" />
                <Button title="Save check-in" onPress={handleAdd} loading={saving} style={styles.saveButton} />
              </GlassCard>
            ) : (
              <Button title="+ Add check-in" onPress={() => setShowForm(true)} style={styles.addButton} />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <GlassCard style={styles.itemCard}>
            <View style={styles.itemRow}>
              <Text style={[styles.itemTitle, { color: theme.colors.textPrimary }]}>
                {item.focus.replace("_", " ")}
              </Text>
              <Text style={[styles.itemValue, { color: theme.colors.accent }]}>{item.value}</Text>
            </View>
            <Text style={{ color: theme.colors.textSecondary }}>
              {format(parseISO(item.date), "MMM d, yyyy")}
              {item.note ? ` · ${item.note}` : ""}
            </Text>
          </GlassCard>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ color: theme.colors.textSecondary, textAlign: "center", marginTop: 24 }}>
              No check-ins logged yet.
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
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  itemTitle: { fontSize: 16, fontWeight: "700", textTransform: "capitalize" },
  itemValue: { fontSize: 18, fontWeight: "800" },
  error: { color: "#DC2626", marginBottom: 12 },
});

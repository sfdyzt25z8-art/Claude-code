import React, { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { format, parseISO } from "date-fns";
import { SUBJECTS, type Homework, type Subject } from "@organizer/shared";
import { useTheme } from "../../theme/ThemeContext";
import { apiDelete, apiGet, apiPatch, apiPost } from "../../lib/api";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";

export function HomeworkScreen() {
  const { theme } = useTheme();
  const [items, setItems] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [subject, setSubject] = useState<Subject>("math");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<Homework[]>("/api/student/homework");
      setItems(data);
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
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const created = await apiPost<Homework>("/api/student/homework", {
        title: title.trim(),
        description: description.trim() || null,
        subject,
        dueDate: new Date(dueDate).toISOString(),
      });
      setItems((prev) => [created, ...prev]);
      setTitle("");
      setDescription("");
      setShowForm(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleComplete(item: Homework) {
    const previous = items;
    setItems((prev) =>
      prev.map((h) => (h.id === item.id ? { ...h, completed: !h.completed } : h)),
    );
    try {
      await apiPatch<Homework>(`/api/student/homework/${item.id}`, {
        completed: !item.completed,
      });
    } catch (e) {
      setItems(previous);
      setError((e as Error).message);
    }
  }

  async function remove(item: Homework) {
    const previous = items;
    setItems((prev) => prev.filter((h) => h.id !== item.id));
    try {
      await apiDelete(`/api/student/homework/${item.id}`);
    } catch (e) {
      setItems(previous);
      setError((e as Error).message);
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
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Homework</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {showForm ? (
              <GlassCard style={styles.formCard}>
                <Input label="Title" value={title} onChangeText={setTitle} placeholder="Read chapter 4" />
                <Input
                  label="Description (optional)"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Notes about the assignment"
                />
                <Input
                  label="Due date (YYYY-MM-DD)"
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="2026-08-01"
                />
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
                <Button title="Save" onPress={handleAdd} loading={saving} style={styles.saveButton} />
              </GlassCard>
            ) : (
              <Button title="+ Add homework" onPress={() => setShowForm(true)} style={styles.addButton} />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <GlassCard style={styles.itemCard}>
            <View style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text
                  style={[
                    styles.itemTitle,
                    {
                      color: theme.colors.textPrimary,
                      textDecorationLine: item.completed ? "line-through" : "none",
                    },
                  ]}
                >
                  {item.title}
                </Text>
                <Text style={{ color: theme.colors.textSecondary }}>
                  {item.subject.replace("_", " ")} · due {format(parseISO(item.dueDate), "MMM d")}
                </Text>
              </View>
              <Badge label={item.completed ? "Done" : "Pending"} tone={item.completed ? "success" : "accent"} />
            </View>
            <View style={styles.itemActions}>
              <Button
                title={item.completed ? "Mark pending" : "Mark done"}
                variant="outline"
                onPress={() => toggleComplete(item)}
                style={styles.smallButton}
              />
              <Button title="Delete" variant="outline" onPress={() => remove(item)} style={styles.smallButton} />
            </View>
          </GlassCard>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ color: theme.colors.textSecondary, textAlign: "center", marginTop: 24 }}>
              No homework yet. Add your first assignment above.
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
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  itemInfo: { flex: 1, marginRight: 8 },
  itemTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  itemActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  smallButton: { flex: 1, paddingVertical: 8 },
  error: { color: "#DC2626", marginBottom: 12 },
});

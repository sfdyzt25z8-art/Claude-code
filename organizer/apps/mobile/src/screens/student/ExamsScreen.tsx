import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { SUBJECTS, type Exam, type Subject } from "@organizer/shared";
import { useTheme } from "../../theme/ThemeContext";
import { apiGet, apiPost } from "../../lib/api";
import { scheduleReminderNotification } from "../../lib/notifications";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";

export function ExamsScreen() {
  const { theme } = useTheme();
  const [items, setItems] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [location, setLocation] = useState("");
  const [subject, setSubject] = useState<Subject>("math");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminderSetFor, setReminderSetFor] = useState<Set<string>>(new Set());

  async function load() {
    setLoading(true);
    try {
      const { exams } = await apiGet<{ exams: Exam[] }>("/api/student/exams");
      setItems(exams.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
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
      const { exam: created } = await apiPost<{ exam: Exam }>("/api/student/exams", {
        title: title.trim(),
        subject,
        date: new Date(date).toISOString(),
        location: location.trim() || null,
      });
      setItems((prev) =>
        [created, ...prev].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      );
      setTitle("");
      setLocation("");
      setShowForm(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemindMe(exam: Exam) {
    const id = await scheduleReminderNotification({
      title: `Exam tomorrow: ${exam.title}`,
      body: `${exam.subject.replace("_", " ")} exam${exam.location ? ` at ${exam.location}` : ""}.`,
      dueAt: parseISO(exam.date),
      minutesBefore: 24 * 60,
      data: { examId: exam.id },
    });
    if (id) {
      setReminderSetFor((prev) => new Set(prev).add(exam.id));
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
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Exam countdown</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {showForm ? (
              <GlassCard style={styles.formCard}>
                <Input label="Exam title" value={title} onChangeText={setTitle} placeholder="Midterm" />
                <Input label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-08-10" />
                <Input label="Location (optional)" value={location} onChangeText={setLocation} placeholder="Room 204" />
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
                <Button title="Save exam" onPress={handleAdd} loading={saving} style={styles.saveButton} />
              </GlassCard>
            ) : (
              <Button title="+ Add exam" onPress={() => setShowForm(true)} style={styles.addButton} />
            )}
          </View>
        }
        renderItem={({ item }) => {
          const daysLeft = differenceInCalendarDays(parseISO(item.date), new Date());
          return (
            <GlassCard style={styles.itemCard}>
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemTitle, { color: theme.colors.textPrimary }]}>{item.title}</Text>
                  <Text style={{ color: theme.colors.textSecondary }}>
                    {item.subject.replace("_", " ")} · {format(parseISO(item.date), "MMM d, yyyy")}
                    {item.location ? ` · ${item.location}` : ""}
                  </Text>
                </View>
                <Badge
                  label={daysLeft < 0 ? "Past" : daysLeft === 0 ? "Today" : `${daysLeft}d`}
                  tone={daysLeft < 0 ? "neutral" : daysLeft <= 2 ? "danger" : "accent"}
                />
              </View>
              <Button
                title={reminderSetFor.has(item.id) ? "Reminder set ✓" : "Remind me 1 day before"}
                variant="outline"
                disabled={reminderSetFor.has(item.id)}
                onPress={() => handleRemindMe(item)}
                style={styles.remindButton}
              />
            </GlassCard>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ color: theme.colors.textSecondary, textAlign: "center", marginTop: 24 }}>
              No exams scheduled yet.
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
  remindButton: { marginTop: 12 },
  error: { color: "#DC2626", marginBottom: 12 },
});

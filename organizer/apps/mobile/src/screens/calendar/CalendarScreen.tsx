import React, { useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { format, parseISO } from "date-fns";
import type { CalendarEvent, CalendarEventCategory } from "@organizer/shared";
import { useTheme } from "../../theme/ThemeContext";
import { apiGet } from "../../lib/api";
import { GlassCard } from "../../components/ui/GlassCard";
import { Badge } from "../../components/ui/Badge";

const CATEGORY_TONE: Record<CalendarEventCategory, "accent" | "success" | "danger" | "neutral"> = {
  homework: "accent",
  exam: "danger",
  business: "accent",
  personal: "neutral",
  habit: "success",
  goal: "accent",
  reading: "neutral",
  study: "accent",
};

interface AgendaSection {
  dateKey: string;
  label: string;
  events: CalendarEvent[];
}

export function CalendarScreen() {
  const { theme } = useTheme();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<CalendarEvent[]>("/api/calendar/events");
      setEvents(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const sections: AgendaSection[] = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
    const map = new Map<string, CalendarEvent[]>();
    for (const event of sorted) {
      const dateKey = format(parseISO(event.startAt), "yyyy-MM-dd");
      const bucket = map.get(dateKey) ?? [];
      bucket.push(event);
      map.set(dateKey, bucket);
    }
    return Array.from(map.entries()).map(([dateKey, dayEvents]) => ({
      dateKey,
      label: format(parseISO(dateKey), "EEEE, MMM d"),
      events: dayEvents,
    }));
  }, [events]);

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={sections}
        keyExtractor={(section) => section.dateKey}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListHeaderComponent={
          <View>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Calendar</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        renderItem={({ item: section }) => (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>{section.label}</Text>
            {section.events.map((event) => (
              <GlassCard key={event.id} style={styles.eventCard}>
                <View style={styles.eventRow}>
                  <View style={styles.eventInfo}>
                    <Text style={[styles.eventTitle, { color: theme.colors.textPrimary }]}>{event.title}</Text>
                    <Text style={{ color: theme.colors.textSecondary }}>
                      {event.allDay ? "All day" : format(parseISO(event.startAt), "h:mm a")}
                      {event.notes ? ` · ${event.notes}` : ""}
                    </Text>
                  </View>
                  <Badge label={event.category} tone={CATEGORY_TONE[event.category]} />
                </View>
              </GlassCard>
            ))}
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ color: theme.colors.textSecondary, textAlign: "center", marginTop: 24 }}>
              No upcoming events. Homework, exams, and goals with due dates will show up here.
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
  title: { fontSize: 24, fontWeight: "800", marginBottom: 16, marginTop: 40 },
  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 13, fontWeight: "700", marginBottom: 8, textTransform: "uppercase" },
  eventCard: { marginBottom: 10 },
  eventRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  eventInfo: { flex: 1, marginRight: 8 },
  eventTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  error: { color: "#DC2626", marginBottom: 12 },
});

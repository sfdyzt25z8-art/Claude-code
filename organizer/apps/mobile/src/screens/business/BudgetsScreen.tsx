import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { Budget } from "@organizer/shared";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../../lib/auth-context";
import { apiDelete, apiGet, apiPost } from "../../lib/api";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

const PERIODS: Budget["period"][] = ["weekly", "monthly", "yearly"];

export function BudgetsScreen() {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const currency = profile?.currency ?? "USD";

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [period, setPeriod] = useState<Budget["period"]>("monthly");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<Budget[]>("/api/business/budgets");
      setBudgets(data);
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
    const limitNum = Number(limit);
    if (!category.trim() || Number.isNaN(limitNum) || limitNum <= 0) return;
    setSaving(true);
    setError(null);
    try {
      const created = await apiPost<Budget>("/api/business/budgets", {
        category: category.trim(),
        limit: limitNum,
        currency,
        period,
      });
      setBudgets((prev) => [created, ...prev]);
      setCategory("");
      setLimit("");
      setShowForm(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(budget: Budget) {
    const previous = budgets;
    setBudgets((prev) => prev.filter((b) => b.id !== budget.id));
    try {
      await apiDelete(`/api/business/budgets/${budget.id}`);
    } catch (e) {
      setBudgets(previous);
      setError((e as Error).message);
    }
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <FlatList
        contentContainerStyle={styles.list}
        data={budgets}
        keyExtractor={(item) => item.id}
        onRefresh={load}
        refreshing={loading}
        ListHeaderComponent={
          <View>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Budgets</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {showForm ? (
              <GlassCard style={styles.formCard}>
                <Input label="Category" value={category} onChangeText={setCategory} placeholder="Marketing" />
                <Input label={`Limit (${currency})`} value={limit} onChangeText={setLimit} keyboardType="decimal-pad" placeholder="500" />
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Period</Text>
                <View style={styles.chipRow}>
                  {PERIODS.map((p) => (
                    <Pressable
                      key={p}
                      onPress={() => setPeriod(p)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: period === p ? theme.colors.accent : theme.colors.surface,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text style={{ color: period === p ? "#0B0F19" : theme.colors.textPrimary }}>{p}</Text>
                    </Pressable>
                  ))}
                </View>
                <Button title="Save budget" onPress={handleAdd} loading={saving} style={styles.saveButton} />
              </GlassCard>
            ) : (
              <Button title="+ Add budget" onPress={() => setShowForm(true)} style={styles.addButton} />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <GlassCard style={styles.itemCard}>
            <View style={styles.itemRow}>
              <View>
                <Text style={[styles.itemTitle, { color: theme.colors.textPrimary }]}>{item.category}</Text>
                <Text style={{ color: theme.colors.textSecondary }}>
                  {item.currency} {item.limit.toFixed(2)} / {item.period}
                </Text>
              </View>
              <Button title="Delete" variant="outline" onPress={() => remove(item)} style={styles.deleteButton} />
            </View>
          </GlassCard>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ color: theme.colors.textSecondary, textAlign: "center", marginTop: 24 }}>
              No budgets set yet.
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
  chipRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },
  formCard: { marginBottom: 16 },
  addButton: { marginBottom: 16 },
  saveButton: { marginTop: 4 },
  itemCard: { marginBottom: 12 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  deleteButton: { paddingHorizontal: 12, paddingVertical: 8 },
  error: { color: "#DC2626", marginBottom: 12 },
});

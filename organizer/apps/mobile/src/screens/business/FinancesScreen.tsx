import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { format, parseISO } from "date-fns";
import type { RevenueEntry, ExpenseEntry } from "@organizer/shared";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../../lib/auth-context";
import { apiGet, apiPost } from "../../lib/api";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

type EntryKind = "revenue" | "expense";
type CombinedEntry =
  | (RevenueEntry & { kind: "revenue" })
  | (ExpenseEntry & { kind: "expense" });

export function FinancesScreen() {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const currency = profile?.currency ?? "USD";

  const [revenue, setRevenue] = useState<RevenueEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<EntryKind>("revenue");
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState(""); // source (revenue) or category (expense)
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [revenueData, expenseData] = await Promise.all([
        apiGet<RevenueEntry[]>("/api/business/revenue"),
        apiGet<ExpenseEntry[]>("/api/business/expenses"),
      ]);
      setRevenue(revenueData);
      setExpenses(expenseData);
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
    const amountNum = Number(amount);
    if (Number.isNaN(amountNum) || amountNum <= 0 || !label.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (kind === "revenue") {
        const created = await apiPost<RevenueEntry>("/api/business/revenue", {
          amount: amountNum,
          currency,
          source: label.trim(),
          date: new Date().toISOString(),
        });
        setRevenue((prev) => [created, ...prev]);
      } else {
        const created = await apiPost<ExpenseEntry>("/api/business/expenses", {
          amount: amountNum,
          currency,
          category: label.trim(),
          date: new Date().toISOString(),
        });
        setExpenses((prev) => [created, ...prev]);
      }
      setAmount("");
      setLabel("");
      setShowForm(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const combined: CombinedEntry[] = [
    ...revenue.map((r) => ({ ...r, kind: "revenue" as const })),
    ...expenses.map((e) => ({ ...e, kind: "expense" as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <FlatList
        contentContainerStyle={styles.list}
        data={combined}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        onRefresh={load}
        refreshing={loading}
        ListHeaderComponent={
          <View>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Finances</Text>

            <View style={styles.totalsRow}>
              <GlassCard style={styles.totalCard}>
                <Text style={{ color: theme.colors.textSecondary }}>Revenue</Text>
                <Text style={[styles.totalNumber, { color: "#16A34A" }]}>
                  {currency} {totalRevenue.toFixed(2)}
                </Text>
              </GlassCard>
              <GlassCard style={styles.totalCard}>
                <Text style={{ color: theme.colors.textSecondary }}>Expenses</Text>
                <Text style={[styles.totalNumber, { color: "#DC2626" }]}>
                  {currency} {totalExpenses.toFixed(2)}
                </Text>
              </GlassCard>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {showForm ? (
              <GlassCard style={styles.formCard}>
                <View style={styles.kindRow}>
                  {(["revenue", "expense"] as EntryKind[]).map((k) => (
                    <Pressable
                      key={k}
                      onPress={() => setKind(k)}
                      style={[
                        styles.kindChip,
                        {
                          backgroundColor: kind === k ? theme.colors.accent : theme.colors.surface,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text style={{ color: kind === k ? "#0B0F19" : theme.colors.textPrimary, fontWeight: "700" }}>
                        {k === "revenue" ? "Revenue" : "Expense"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Input
                  label="Amount"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />
                <Input
                  label={kind === "revenue" ? "Source" : "Category"}
                  value={label}
                  onChangeText={setLabel}
                  placeholder={kind === "revenue" ? "Client invoice" : "Rent, software, ads…"}
                />
                <Button title="Save entry" onPress={handleAdd} loading={saving} style={styles.saveButton} />
              </GlassCard>
            ) : (
              <Button title="+ Add revenue / expense" onPress={() => setShowForm(true)} style={styles.addButton} />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <GlassCard style={styles.itemCard}>
            <View style={styles.itemRow}>
              <View>
                <Text style={[styles.itemTitle, { color: theme.colors.textPrimary }]}>
                  {item.kind === "revenue" ? item.source : item.category}
                </Text>
                <Text style={{ color: theme.colors.textSecondary }}>
                  {format(parseISO(item.date), "MMM d, yyyy")}
                </Text>
              </View>
              <Text
                style={[
                  styles.itemAmount,
                  { color: item.kind === "revenue" ? "#16A34A" : "#DC2626" },
                ]}
              >
                {item.kind === "revenue" ? "+" : "-"}
                {item.currency} {item.amount.toFixed(2)}
              </Text>
            </View>
          </GlassCard>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ color: theme.colors.textSecondary, textAlign: "center", marginTop: 24 }}>
              No revenue or expenses logged yet.
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
  totalsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  totalCard: { flex: 1, alignItems: "center", paddingVertical: 16 },
  totalNumber: { fontSize: 18, fontWeight: "800", marginTop: 4 },
  formCard: { marginBottom: 16 },
  kindRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  kindChip: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  addButton: { marginBottom: 16 },
  saveButton: { marginTop: 4 },
  itemCard: { marginBottom: 12 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  itemAmount: { fontSize: 16, fontWeight: "700" },
  error: { color: "#DC2626", marginBottom: 12 },
});

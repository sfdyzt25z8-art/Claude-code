"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import type { ExpenseEntry, RevenueEntry } from "@organizer/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks";
import { apiDelete, apiPost, ApiError } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

const revenueSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  source: z.string().min(1, "Add a source"),
  date: z.string().min(1, "Pick a date"),
});
const expenseSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.string().min(1, "Add a category"),
  date: z.string().min(1, "Pick a date"),
});

export default function FinancesPage() {
  const { profile } = useAuth();
  const currency = profile?.currency ?? "USD";
  const [tab, setTab] = useState<"revenue" | "expenses">("revenue");

  const { data: revenueRes, loading: revLoading, refetch: refetchRevenue } = useFetch<{ revenue: RevenueEntry[] }>(
    "/api/business/revenue"
  );
  const revenue = revenueRes?.revenue;
  const { data: expensesRes, loading: expLoading, refetch: refetchExpenses } = useFetch<{ expenses: ExpenseEntry[] }>(
    "/api/business/expenses"
  );
  const expenses = expensesRes?.expenses;

  const [modalOpen, setModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const revenueForm = useForm<z.infer<typeof revenueSchema>>({ resolver: zodResolver(revenueSchema) });
  const expenseForm = useForm<z.infer<typeof expenseSchema>>({ resolver: zodResolver(expenseSchema) });

  const chartData = useMemo(() => {
    const buckets = new Map<string, { revenue: number; expenses: number }>();
    for (const r of revenue ?? []) {
      const key = formatDate(r.date, { month: "short" });
      const b = buckets.get(key) ?? { revenue: 0, expenses: 0 };
      b.revenue += r.amount;
      buckets.set(key, b);
    }
    for (const e of expenses ?? []) {
      const key = formatDate(e.date, { month: "short" });
      const b = buckets.get(key) ?? { revenue: 0, expenses: 0 };
      b.expenses += e.amount;
      buckets.set(key, b);
    }
    return Array.from(buckets.entries()).map(([month, v]) => ({ month, ...v }));
  }, [revenue, expenses]);

  const onCreateRevenue = async (values: z.infer<typeof revenueSchema>) => {
    setSubmitError(null);
    try {
      await apiPost<RevenueEntry>("/api/business/revenue", { ...values, currency });
      revenueForm.reset();
      setModalOpen(false);
      refetchRevenue();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not add revenue.");
    }
  };

  const onCreateExpense = async (values: z.infer<typeof expenseSchema>) => {
    setSubmitError(null);
    try {
      await apiPost<ExpenseEntry>("/api/business/expenses", { ...values, currency });
      expenseForm.reset();
      setModalOpen(false);
      refetchExpenses();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not add expense.");
    }
  };

  const removeRevenue = async (id: string) => {
    await apiDelete(`/api/business/revenue/${id}`).catch(() => null);
    refetchRevenue();
  };
  const removeExpense = async (id: string) => {
    await apiDelete(`/api/business/expenses/${id}`).catch(() => null);
    refetchExpenses();
  };

  const list = tab === "revenue" ? revenue ?? [] : expenses ?? [];
  const loading = tab === "revenue" ? revLoading : expLoading;

  return (
    <div>
      <PageHeader
        title="Finances"
        subtitle="Log revenue and expenses to keep your books current."
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add {tab === "revenue" ? "revenue" : "expense"}
          </Button>
        }
      />

      <GlassCard className="mb-6">
        <h2 className="mb-3 font-semibold text-[var(--color-text-primary)]">Revenue vs. expenses</h2>
        {chartData.length === 0 ? (
          <EmptyState title="No financial data yet" icon={TrendingUp} />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-text-secondary)" fontSize={12} />
                <YAxis stroke="var(--color-text-secondary)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                <Bar dataKey="revenue" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassCard>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("revenue")}
          className={`rounded-xl px-4 py-2 text-sm font-medium ${tab === "revenue" ? "bg-[var(--color-accent)] text-black" : "border"}`}
          style={tab !== "revenue" ? { borderColor: "var(--color-border)" } : undefined}
        >
          <TrendingUp className="mr-1 inline h-4 w-4" /> Revenue
        </button>
        <button
          onClick={() => setTab("expenses")}
          className={`rounded-xl px-4 py-2 text-sm font-medium ${tab === "expenses" ? "bg-[var(--color-accent)] text-black" : "border"}`}
          style={tab !== "expenses" ? { borderColor: "var(--color-border)" } : undefined}
        >
          <TrendingDown className="mr-1 inline h-4 w-4" /> Expenses
        </button>
      </div>

      <GlassCard>
        {loading ? (
          <LoadingSpinner />
        ) : list.length === 0 ? (
          <EmptyState title={`No ${tab} logged yet`} icon={tab === "revenue" ? TrendingUp : TrendingDown} />
        ) : (
          <ul className="flex flex-col gap-2">
            {list
              .slice()
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((entry) => (
                <li key={entry.id} className="flex items-center justify-between border-b py-2 text-sm last:border-0" style={{ borderColor: "var(--color-border)" }}>
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {"source" in entry ? entry.source : entry.category}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{formatDate(entry.date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={tab === "revenue" ? "font-semibold text-emerald-500" : "font-semibold text-red-500"}>
                      {formatCurrency(entry.amount, entry.currency)}
                    </span>
                    <button
                      onClick={() => (tab === "revenue" ? removeRevenue(entry.id) : removeExpense(entry.id))}
                      aria-label="Delete entry"
                      className="rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </GlassCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Add ${tab === "revenue" ? "revenue" : "expense"}`}>
        {tab === "revenue" ? (
          <form onSubmit={revenueForm.handleSubmit(onCreateRevenue)} className="flex flex-col gap-4" noValidate>
            <Input label="Amount" type="number" step="0.01" error={revenueForm.formState.errors.amount?.message} {...revenueForm.register("amount")} />
            <Input label="Source" placeholder="Client payment" error={revenueForm.formState.errors.source?.message} {...revenueForm.register("source")} />
            <Input label="Date" type="date" error={revenueForm.formState.errors.date?.message} {...revenueForm.register("date")} />
            {submitError && <p className="text-sm font-medium text-red-500">{submitError}</p>}
            <Button type="submit" fullWidth loading={revenueForm.formState.isSubmitting}>
              Save revenue
            </Button>
          </form>
        ) : (
          <form onSubmit={expenseForm.handleSubmit(onCreateExpense)} className="flex flex-col gap-4" noValidate>
            <Input label="Amount" type="number" step="0.01" error={expenseForm.formState.errors.amount?.message} {...expenseForm.register("amount")} />
            <Input label="Category" placeholder="Software" error={expenseForm.formState.errors.category?.message} {...expenseForm.register("category")} />
            <Input label="Date" type="date" error={expenseForm.formState.errors.date?.message} {...expenseForm.register("date")} />
            {submitError && <p className="text-sm font-medium text-red-500">{submitError}</p>}
            <Button type="submit" fullWidth loading={expenseForm.formState.isSubmitting}>
              Save expense
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}

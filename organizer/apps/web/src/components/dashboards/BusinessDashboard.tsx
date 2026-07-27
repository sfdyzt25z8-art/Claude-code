"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Briefcase, Megaphone, PiggyBank, Target, TrendingUp } from "lucide-react";
import type { BusinessGoal, CareerGoal, ExpenseEntry, Budget, MarketingPlanItem, RevenueEntry } from "@organizer/shared";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks";
import { formatCurrency, formatDate, titleCase } from "@/lib/utils";

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, 1).toLocaleDateString(undefined, { month: "short" });
}

function OwnerDashboard() {
  const { profile } = useAuth();
  const currency = profile?.currency ?? "USD";
  const { data: revenue, loading: revLoading } = useFetch<RevenueEntry[]>("/api/business/revenue");
  const { data: expenses, loading: expLoading } = useFetch<ExpenseEntry[]>("/api/business/expenses");
  const { data: budgets, loading: budgetsLoading } = useFetch<Budget[]>("/api/business/budgets");
  const { data: goals, loading: goalsLoading } = useFetch<BusinessGoal[]>("/api/business/goals");
  const { data: marketing, loading: marketingLoading } = useFetch<MarketingPlanItem[]>("/api/business/marketing");

  const chartData = useMemo(() => {
    const buckets = new Map<string, { revenue: number; expenses: number }>();
    for (const r of revenue ?? []) {
      const key = monthKey(r.date);
      const bucket = buckets.get(key) ?? { revenue: 0, expenses: 0 };
      bucket.revenue += r.amount;
      buckets.set(key, bucket);
    }
    for (const e of expenses ?? []) {
      const key = monthKey(e.date);
      const bucket = buckets.get(key) ?? { revenue: 0, expenses: 0 };
      bucket.expenses += e.amount;
      buckets.set(key, bucket);
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(-6)
      .map(([key, v]) => ({ month: monthLabel(key), revenue: v.revenue, profit: v.revenue - v.expenses, expenses: v.expenses }));
  }, [revenue, expenses]);

  const totalRevenue = (revenue ?? []).reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = (expenses ?? []).reduce((sum, e) => sum + e.amount, 0);
  const profit = totalRevenue - totalExpenses;

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses ?? []) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    return map;
  }, [expenses]);

  const upcomingMarketing = (marketing ?? [])
    .filter((m) => m.status !== "done")
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlassCard>
          <p className="text-xs text-[var(--color-text-secondary)]">Total revenue</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{formatCurrency(totalRevenue, currency)}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-[var(--color-text-secondary)]">Total expenses</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{formatCurrency(totalExpenses, currency)}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-[var(--color-text-secondary)]">Net profit</p>
          <p className={`mt-1 text-2xl font-bold ${profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {formatCurrency(profit, currency)}
          </p>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[var(--color-accent)]" />
          <h2 className="font-semibold text-[var(--color-text-primary)]">Revenue vs. profit</h2>
        </div>
        {revLoading || expLoading ? (
          <LoadingSpinner />
        ) : chartData.length === 0 ? (
          <EmptyState title="No financial data yet" description="Add revenue and expenses to see your trend." icon={TrendingUp} />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-text-secondary)" fontSize={12} />
                <YAxis stroke="var(--color-text-secondary)" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-accent)" fill="url(#revGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" stroke="#22c55e" fill="url(#profitGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard>
          <div className="mb-3 flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-[var(--color-accent)]" />
            <h2 className="font-semibold text-[var(--color-text-primary)]">Budget status</h2>
          </div>
          {budgetsLoading ? (
            <LoadingSpinner />
          ) : (budgets ?? []).length === 0 ? (
            <EmptyState title="No budgets set" icon={PiggyBank} />
          ) : (
            <ul className="flex flex-col gap-4">
              {(budgets ?? []).slice(0, 4).map((b) => {
                const spent = spentByCategory.get(b.category) ?? 0;
                return (
                  <li key={b.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-[var(--color-text-primary)]">{titleCase(b.category)}</span>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {formatCurrency(spent, b.currency)} / {formatCurrency(b.limit, b.currency)}
                      </span>
                    </div>
                    <ProgressBar value={spent} max={b.limit} colorClassName={spent > b.limit ? "bg-red-500" : undefined} />
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/business/budget" className="mt-4 inline-block text-xs font-medium text-[var(--color-accent)] hover:underline">
            Manage budgets →
          </Link>
        </GlassCard>

        <GlassCard>
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-5 w-5 text-[var(--color-accent)]" />
            <h2 className="font-semibold text-[var(--color-text-primary)]">Business goals</h2>
          </div>
          {goalsLoading ? (
            <LoadingSpinner />
          ) : (goals ?? []).length === 0 ? (
            <EmptyState title="No goals yet" icon={Target} />
          ) : (
            <ul className="flex flex-col gap-4">
              {(goals ?? []).slice(0, 4).map((g) => (
                <li key={g.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-[var(--color-text-primary)]">{g.title}</span>
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {g.currentValue}/{g.targetValue} {g.unit}
                    </span>
                  </div>
                  <ProgressBar value={g.currentValue} max={g.targetValue} />
                </li>
              ))}
            </ul>
          )}
          <Link href="/business/goals" className="mt-4 inline-block text-xs font-medium text-[var(--color-accent)] hover:underline">
            View all goals →
          </Link>
        </GlassCard>

        <GlassCard>
          <div className="mb-3 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-[var(--color-accent)]" />
            <h2 className="font-semibold text-[var(--color-text-primary)]">Marketing plan</h2>
          </div>
          {marketingLoading ? (
            <LoadingSpinner />
          ) : upcomingMarketing.length === 0 ? (
            <EmptyState title="No upcoming marketing items" icon={Megaphone} />
          ) : (
            <ul className="flex flex-col gap-3">
              {upcomingMarketing.map((m) => (
                <li key={m.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">{m.title}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{m.channel}</p>
                  </div>
                  <Badge tone={m.status === "in_progress" ? "warning" : "neutral"}>{formatDate(m.scheduledDate)}</Badge>
                </li>
              ))}
            </ul>
          )}
          <Link href="/business/marketing" className="mt-4 inline-block text-xs font-medium text-[var(--color-accent)] hover:underline">
            Open marketing plan →
          </Link>
        </GlassCard>
      </div>
    </div>
  );
}

function EmployeeDashboard() {
  const { data: careerGoals, loading } = useFetch<CareerGoal[]>("/api/business/career-goals");
  const active = (careerGoals ?? []).filter((g) => !g.completed);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of careerGoals ?? []) {
      map.set(g.category, (map.get(g.category) ?? 0) + 1);
    }
    return Array.from(map.entries());
  }, [careerGoals]);

  return (
    <div className="flex flex-col gap-6">
      <GlassCard>
        <div className="mb-3 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-[var(--color-accent)]" />
          <h2 className="font-semibold text-[var(--color-text-primary)]">Your career goals</h2>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : active.length === 0 ? (
          <EmptyState title="No active career goals" description="Set a goal to start tracking your growth." icon={Target} />
        ) : (
          <ul className="flex flex-col gap-3">
            {active.slice(0, 6).map((g) => (
              <li key={g.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">{g.title}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{titleCase(g.category)}</p>
                </div>
                {g.targetDate && <Badge tone="neutral">{formatDate(g.targetDate)}</Badge>}
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {byCategory.length === 0 ? (
          <GlassCard className="sm:col-span-3">
            <EmptyState title="No productivity data yet" description="Career goals you add will appear here by category." icon={Target} />
          </GlassCard>
        ) : (
          byCategory.map(([cat, count]) => (
            <GlassCard key={cat}>
              <p className="text-xs text-[var(--color-text-secondary)]">{titleCase(cat)}</p>
              <p className="mt-1 text-xl font-bold text-[var(--color-text-primary)]">{count} goal{count === 1 ? "" : "s"}</p>
            </GlassCard>
          ))
        )}
      </div>

      <GlassCard>
        <h2 className="mb-2 font-semibold text-[var(--color-text-primary)]">Grow your skills</h2>
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          Explore the growth academies to build marketing, leadership, and technical skills.
        </p>
        <Link href="/business/academies" className="text-sm font-medium text-[var(--color-accent)] hover:underline">
          Browse academies →
        </Link>
      </GlassCard>
    </div>
  );
}

export function BusinessDashboard() {
  const { profile } = useAuth();
  const isOwner = profile?.ownsBusiness ?? profile?.businessRole === "owner";
  return isOwner ? <OwnerDashboard /> : <EmployeeDashboard />;
}

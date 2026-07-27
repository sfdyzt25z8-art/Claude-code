"use client";

import { Bar, BarChart, Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks";

interface StatisticsResponse {
  goalsCompleted?: { period: string; count: number }[];
  studyHours?: { period: string; hours: number }[];
  readingHours?: { period: string; hours: number }[];
  quizScoreTrend?: { date: string; scorePct: number }[];
  gradeTrend?: { date: string; averagePct: number }[];
  habitsCompletionRate?: { period: string; ratePct: number }[];
  businessRevenueTrend?: { period: string; revenue: number; expenses: number }[];
}

const tooltipStyle = { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12 };

function ChartCard({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  return (
    <GlassCard>
      <h2 className="mb-3 font-semibold text-[var(--color-text-primary)]">{title}</h2>
      {empty ? <EmptyState title="No data yet" icon={BarChart3} /> : <div className="h-56 w-full">{children}</div>}
    </GlassCard>
  );
}

export default function StatisticsPage() {
  const { profile } = useAuth();
  const { data: stats, loading, error } = useFetch<StatisticsResponse>("/api/statistics");

  return (
    <div>
      <PageHeader title="Statistics" subtitle="A bird's-eye view of your growth across every area." />

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Goals completed" empty={!stats?.goalsCompleted?.length}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.goalsCompleted}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="period" stroke="var(--color-text-secondary)" fontSize={11} />
                <YAxis stroke="var(--color-text-secondary)" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {profile?.mode === "student" && (
            <>
              <ChartCard title="Study hours" empty={!stats?.studyHours?.length}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.studyHours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="period" stroke="var(--color-text-secondary)" fontSize={11} />
                    <YAxis stroke="var(--color-text-secondary)" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="hours" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Reading hours" empty={!stats?.readingHours?.length}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.readingHours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="period" stroke="var(--color-text-secondary)" fontSize={11} />
                    <YAxis stroke="var(--color-text-secondary)" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="hours" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Quiz score trend" empty={!stats?.quizScoreTrend?.length}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats?.quizScoreTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="date" stroke="var(--color-text-secondary)" fontSize={11} />
                    <YAxis stroke="var(--color-text-secondary)" fontSize={11} domain={[0, 100]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="scorePct" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Grade improvement" empty={!stats?.gradeTrend?.length}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats?.gradeTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="date" stroke="var(--color-text-secondary)" fontSize={11} />
                    <YAxis stroke="var(--color-text-secondary)" fontSize={11} domain={[0, 100]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="averagePct" stroke="#22c55e" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </>
          )}

          <ChartCard title="Habit completion rate" empty={!stats?.habitsCompletionRate?.length}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.habitsCompletionRate}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="period" stroke="var(--color-text-secondary)" fontSize={11} />
                <YAxis stroke="var(--color-text-secondary)" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="ratePct" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {profile?.mode === "business" && (
            <ChartCard title="Revenue vs. expenses" empty={!stats?.businessRevenueTrend?.length}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.businessRevenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="period" stroke="var(--color-text-secondary)" fontSize={11} />
                  <YAxis stroke="var(--color-text-secondary)" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="revenue" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}
    </div>
  );
}

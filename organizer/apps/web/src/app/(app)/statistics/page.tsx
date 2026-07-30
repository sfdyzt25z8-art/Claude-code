"use client";

import { Bar, BarChart, Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, CheckCircle2, Clock, BookOpen, Flame } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks";
import { formatDate, titleCase } from "@/lib/utils";

/** Matches the shape returned by GET /api/statistics exactly. */
interface StatisticsResponse {
  goalsCompleted: number;
  totalStudyHours: number;
  totalReadingHours: number;
  quizScoreTrend: { date: string; scorePercent: number }[];
  gradeTrend: Record<string, { date: string; percent: number }[]>;
  habitCompletionRate: number;
  habitLogsTotal: number;
  habitLogsCompleted: number;
  business?: { byMonth: { month: string; revenue: number; expenses: number; profit: number }[] };
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

  const quizData = (stats?.quizScoreTrend ?? []).map((p) => ({
    ...p,
    dateLabel: formatDate(p.date, { month: "short", day: "numeric" }),
  }));
  const gradeSubjects = Object.entries(stats?.gradeTrend ?? {});

  return (
    <div>
      <PageHeader title="Statistics" subtitle="A bird's-eye view of your growth across every area." />

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <GlassCard>
              <CheckCircle2 className="mb-2 h-5 w-5 text-[var(--color-accent)]" />
              <p className="text-xs text-[var(--color-text-secondary)]">Goals completed</p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{stats?.goalsCompleted ?? 0}</p>
            </GlassCard>
            {profile?.mode === "student" && (
              <>
                <GlassCard>
                  <Clock className="mb-2 h-5 w-5 text-[var(--color-accent)]" />
                  <p className="text-xs text-[var(--color-text-secondary)]">Study hours</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{stats?.totalStudyHours ?? 0}</p>
                </GlassCard>
                <GlassCard>
                  <BookOpen className="mb-2 h-5 w-5 text-[var(--color-accent)]" />
                  <p className="text-xs text-[var(--color-text-secondary)]">Reading hours (est.)</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{stats?.totalReadingHours ?? 0}</p>
                </GlassCard>
              </>
            )}
            <GlassCard>
              <Flame className="mb-2 h-5 w-5 text-[var(--color-accent)]" />
              <p className="text-xs text-[var(--color-text-secondary)]">Habit completion rate</p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{stats?.habitCompletionRate ?? 0}%</p>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {profile?.mode === "student" && (
              <>
                <ChartCard title="Quiz score trend" empty={quizData.length === 0}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={quizData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="dateLabel" stroke="var(--color-text-secondary)" fontSize={11} />
                      <YAxis stroke="var(--color-text-secondary)" fontSize={11} domain={[0, 100]} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="scorePercent" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>

                {gradeSubjects.map(([subject, points]) => (
                  <ChartCard key={subject} title={`${titleCase(subject)} grades`} empty={points.length === 0}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={points.map((p) => ({ ...p, dateLabel: formatDate(p.date, { month: "short", day: "numeric" }) }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="dateLabel" stroke="var(--color-text-secondary)" fontSize={11} />
                        <YAxis stroke="var(--color-text-secondary)" fontSize={11} domain={[0, 100]} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="percent" stroke="#22c55e" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>
                ))}
              </>
            )}

            {profile?.ownsBusiness && (
              <ChartCard title="Revenue vs. expenses" empty={!stats?.business?.byMonth?.length}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.business?.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="month" stroke="var(--color-text-secondary)" fontSize={11} />
                    <YAxis stroke="var(--color-text-secondary)" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="revenue" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>
        </>
      )}
    </div>
  );
}

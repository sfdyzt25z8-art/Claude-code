"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LineChart as LineChartIcon, Clock, BookOpen, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useFetch } from "@/lib/hooks";
import { formatDate, titleCase } from "@/lib/utils";

/** Matches the shape returned by GET /api/statistics. */
interface StatisticsResponse {
  goalsCompleted: number;
  totalStudyHours: number;
  totalReadingHours: number;
  quizScoreTrend: { date: string; scorePercent: number }[];
  gradeTrend: Record<string, { date: string; percent: number }[]>;
  habitCompletionRate: number;
}

const chartTooltipStyle = { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12 };

export default function StudentProgressPage() {
  const { data: stats, loading, error } = useFetch<StatisticsResponse>("/api/statistics");

  const quizData = (stats?.quizScoreTrend ?? []).map((p) => ({
    ...p,
    dateLabel: formatDate(p.date, { month: "short", day: "numeric" }),
  }));
  const gradeSubjects = Object.entries(stats?.gradeTrend ?? {});

  return (
    <div>
      <PageHeader title="Progress" subtitle="See your quiz scores, grades, and study time over time." />

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            <GlassCard>
              <CheckCircle2 className="mb-2 h-5 w-5 text-[var(--color-accent)]" />
              <p className="text-xs text-[var(--color-text-secondary)]">Goals completed</p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{stats?.goalsCompleted ?? 0}</p>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <GlassCard>
              <h2 className="mb-3 font-semibold text-[var(--color-text-primary)]">Quiz score trend</h2>
              {quizData.length === 0 ? (
                <EmptyState title="No quiz history yet" icon={LineChartIcon} />
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={quizData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="dateLabel" stroke="var(--color-text-secondary)" fontSize={11} />
                      <YAxis stroke="var(--color-text-secondary)" fontSize={11} domain={[0, 100]} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Line type="monotone" dataKey="scorePercent" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </GlassCard>

            {gradeSubjects.length === 0 ? (
              <GlassCard>
                <h2 className="mb-3 font-semibold text-[var(--color-text-primary)]">Grade improvement</h2>
                <EmptyState title="No grade history yet" icon={LineChartIcon} />
              </GlassCard>
            ) : (
              gradeSubjects.map(([subject, points]) => (
                <GlassCard key={subject}>
                  <h2 className="mb-3 font-semibold text-[var(--color-text-primary)]">{titleCase(subject)} grades</h2>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={points.map((p) => ({ ...p, dateLabel: formatDate(p.date, { month: "short", day: "numeric" }) }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="dateLabel" stroke="var(--color-text-secondary)" fontSize={11} />
                        <YAxis stroke="var(--color-text-secondary)" fontSize={11} domain={[0, 100]} />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Line type="monotone" dataKey="percent" stroke="#22c55e" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { Line, LineChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LineChart as LineChartIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useFetch } from "@/lib/hooks";

interface StudentStatistics {
  quizScoreTrend?: { date: string; scorePct: number }[];
  gradeTrend?: { date: string; averagePct: number }[];
  studyHoursBySubject?: { subject: string; hours: number }[];
  readingPagesOverTime?: { date: string; pages: number }[];
}

const chartTooltipStyle = { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12 };

export default function StudentProgressPage() {
  const { data: stats, loading, error } = useFetch<StudentStatistics>("/api/statistics");

  return (
    <div>
      <PageHeader title="Progress" subtitle="See your quiz scores, grades, and study time over time." />

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GlassCard>
            <h2 className="mb-3 font-semibold text-[var(--color-text-primary)]">Quiz score trend</h2>
            {!stats?.quizScoreTrend?.length ? (
              <EmptyState title="No quiz history yet" icon={LineChartIcon} />
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.quizScoreTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="date" stroke="var(--color-text-secondary)" fontSize={11} />
                    <YAxis stroke="var(--color-text-secondary)" fontSize={11} domain={[0, 100]} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Line type="monotone" dataKey="scorePct" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <h2 className="mb-3 font-semibold text-[var(--color-text-primary)]">Grade improvement</h2>
            {!stats?.gradeTrend?.length ? (
              <EmptyState title="No grade history yet" icon={LineChartIcon} />
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.gradeTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="date" stroke="var(--color-text-secondary)" fontSize={11} />
                    <YAxis stroke="var(--color-text-secondary)" fontSize={11} domain={[0, 100]} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Line type="monotone" dataKey="averagePct" stroke="#22c55e" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <h2 className="mb-3 font-semibold text-[var(--color-text-primary)]">Study hours by subject</h2>
            {!stats?.studyHoursBySubject?.length ? (
              <EmptyState title="No study sessions logged yet" icon={LineChartIcon} />
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.studyHoursBySubject}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="subject" stroke="var(--color-text-secondary)" fontSize={11} />
                    <YAxis stroke="var(--color-text-secondary)" fontSize={11} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="hours" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <h2 className="mb-3 font-semibold text-[var(--color-text-primary)]">Reading pages over time</h2>
            {!stats?.readingPagesOverTime?.length ? (
              <EmptyState title="No reading history yet" icon={LineChartIcon} />
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.readingPagesOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="date" stroke="var(--color-text-secondary)" fontSize={11} />
                    <YAxis stroke="var(--color-text-secondary)" fontSize={11} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Line type="monotone" dataKey="pages" stroke="#38bdf8" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}

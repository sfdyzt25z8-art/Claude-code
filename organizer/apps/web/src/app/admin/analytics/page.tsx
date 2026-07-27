"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";
import type { AdminAnalyticsSnapshot } from "@organizer/shared";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useFetch } from "@/lib/hooks";
import { formatDate } from "@/lib/utils";

const tooltipStyle = { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12 };

export default function AdminAnalyticsPage() {
  const { data: snapshots, loading, error } = useFetch<AdminAnalyticsSnapshot[]>("/api/admin/analytics");

  const chartData = (snapshots ?? [])
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((s) => ({ ...s, dateLabel: formatDate(s.date, { month: "short", day: "numeric" }) }));

  const latest = chartData[chartData.length - 1];

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-[var(--color-accent)]" />
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Platform Analytics</h1>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : chartData.length === 0 ? (
        <EmptyState title="No analytics data yet" icon={BarChart3} />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Total users", value: latest?.totalUsers },
              { label: "Active users", value: latest?.activeUsers },
              { label: "New signups", value: latest?.newSignups },
              { label: "AI requests", value: latest?.aiRequestCount },
            ].map((kpi) => (
              <GlassCard key={kpi.label}>
                <p className="text-xs text-[var(--color-text-secondary)]">{kpi.label}</p>
                <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{kpi.value ?? "—"}</p>
              </GlassCard>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <GlassCard>
              <h2 className="mb-3 font-semibold text-[var(--color-text-primary)]">Active users over time</h2>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="dateLabel" stroke="var(--color-text-secondary)" fontSize={11} />
                    <YAxis stroke="var(--color-text-secondary)" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="activeUsers" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
            <GlassCard>
              <h2 className="mb-3 font-semibold text-[var(--color-text-primary)]">Quizzes taken</h2>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="dateLabel" stroke="var(--color-text-secondary)" fontSize={11} />
                    <YAxis stroke="var(--color-text-secondary)" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="quizzesTaken" stroke="#22c55e" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}

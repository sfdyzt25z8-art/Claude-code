"use client";

import { BarChart3, Users, Activity, UserPlus, Bot, ClipboardCheck } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useFetch } from "@/lib/hooks";
import { formatDate } from "@/lib/utils";

/** Matches the flat, single-snapshot shape returned by GET /api/admin/analytics. */
interface AnalyticsSnapshot {
  date: string;
  totalUsers: number;
  activeUsers: number;
  newSignups: number;
  aiRequestCount: number;
  quizzesTaken: number;
}

export default function AdminAnalyticsPage() {
  const { data: snapshot, loading, error } = useFetch<AnalyticsSnapshot>("/api/admin/analytics");

  const kpis = snapshot
    ? [
        { label: "Total users", value: snapshot.totalUsers, icon: Users },
        { label: "Active users (7d)", value: snapshot.activeUsers, icon: Activity },
        { label: "New signups (7d)", value: snapshot.newSignups, icon: UserPlus },
        { label: "AI requests (all time)", value: snapshot.aiRequestCount, icon: Bot },
        { label: "Quizzes taken (all time)", value: snapshot.quizzesTaken, icon: ClipboardCheck },
      ]
    : [];

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
      ) : !snapshot ? (
        <EmptyState title="No analytics data yet" icon={BarChart3} />
      ) : (
        <>
          <p className="mb-4 text-xs text-[var(--color-text-secondary)]">
            Snapshot as of {formatDate(snapshot.date, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <GlassCard key={kpi.label}>
                  <Icon className="mb-2 h-5 w-5 text-[var(--color-accent)]" />
                  <p className="text-xs text-[var(--color-text-secondary)]">{kpi.label}</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{kpi.value}</p>
                </GlassCard>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

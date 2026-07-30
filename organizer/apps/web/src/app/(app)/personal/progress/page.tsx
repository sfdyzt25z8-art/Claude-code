"use client";

import { useMemo } from "react";
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity } from "lucide-react";
import type { ProgressCheckIn } from "@organizer/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useFetch } from "@/lib/hooks";
import { formatDate, titleCase } from "@/lib/utils";

export default function PersonalProgressPage() {
  const { data: checkinsRes, loading, error } = useFetch<{ checkIns: ProgressCheckIn[] }>("/api/personal/check-ins");
  const checkins = checkinsRes?.checkIns;

  const byFocus = useMemo(() => {
    const map = new Map<string, { date: string; value: number }[]>();
    for (const c of checkins ?? []) {
      const list = map.get(c.focus) ?? [];
      list.push({ date: formatDate(c.date, { month: "short", day: "numeric" }), value: c.value });
      map.set(c.focus, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    return Array.from(map.entries());
  }, [checkins]);

  return (
    <div>
      <PageHeader title="Progress" subtitle="Track how your focus areas are trending over time." />

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : byFocus.length === 0 ? (
        <EmptyState title="No check-ins yet" description="Log a progress check-in to see your trend here." icon={Activity} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {byFocus.map(([focus, data]) => (
            <GlassCard key={focus}>
              <h2 className="mb-3 font-semibold text-[var(--color-text-primary)]">{titleCase(focus)}</h2>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="date" stroke="var(--color-text-secondary)" fontSize={11} />
                    <YAxis stroke="var(--color-text-secondary)" fontSize={11} />
                    <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                    <Line type="monotone" dataKey="value" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

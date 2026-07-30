"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bot } from "lucide-react";
import type { AiUsageRecord } from "@organizer/shared";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useFetch } from "@/lib/hooks";
import { formatDate } from "@/lib/utils";

export default function AdminAiUsagePage() {
  const { data: aiUsageRes, loading, error } = useFetch<{ records: AiUsageRecord[] }>("/api/admin/ai-usage");
  const records = aiUsageRes?.records;

  const totalTokens = (records ?? []).reduce((s, r) => s + r.promptTokens + r.completionTokens, 0);
  const totalRequests = (records ?? []).length;

  const byEndpoint = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of records ?? []) {
      map.set(r.endpoint, (map.get(r.endpoint) ?? 0) + r.promptTokens + r.completionTokens);
    }
    return Array.from(map.entries()).map(([endpoint, tokens]) => ({ endpoint, tokens }));
  }, [records]);

  const recent = (records ?? [])
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 15);

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Bot className="h-6 w-6 text-[var(--color-accent)]" />
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">AI Usage</h1>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-2">
            <GlassCard>
              <p className="text-xs text-[var(--color-text-secondary)]">Total requests</p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{totalRequests}</p>
            </GlassCard>
            <GlassCard>
              <p className="text-xs text-[var(--color-text-secondary)]">Total tokens</p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{totalTokens.toLocaleString()}</p>
            </GlassCard>
          </div>

          <GlassCard className="mb-6">
            <h2 className="mb-3 font-semibold text-[var(--color-text-primary)]">Tokens by endpoint</h2>
            {byEndpoint.length === 0 ? (
              <EmptyState title="No AI usage recorded yet" icon={Bot} />
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byEndpoint}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="endpoint" stroke="var(--color-text-secondary)" fontSize={11} />
                    <YAxis stroke="var(--color-text-secondary)" fontSize={11} />
                    <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                    <Bar dataKey="tokens" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <h2 className="mb-3 font-semibold text-[var(--color-text-primary)]">Recent requests</h2>
            {recent.length === 0 ? (
              <EmptyState title="No recent requests" icon={Bot} />
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-[var(--color-text-secondary)]">
                    <th className="pb-2 pr-4">Endpoint</th>
                    <th className="pb-2 pr-4">Prompt tokens</th>
                    <th className="pb-2 pr-4">Completion tokens</th>
                    <th className="pb-2">When</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                      <td className="py-2 pr-4 font-medium text-[var(--color-text-primary)]">{r.endpoint}</td>
                      <td className="py-2 pr-4 text-[var(--color-text-secondary)]">{r.promptTokens}</td>
                      <td className="py-2 pr-4 text-[var(--color-text-secondary)]">{r.completionTokens}</td>
                      <td className="py-2 text-[var(--color-text-secondary)]">{formatDate(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </GlassCard>
        </>
      )}
    </div>
  );
}

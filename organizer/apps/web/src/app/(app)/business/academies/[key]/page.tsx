"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, GraduationCap } from "lucide-react";
import type { AcademyModule } from "@organizer/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useFetch } from "@/lib/hooks";
import { apiPost } from "@/lib/api";
import { titleCase } from "@/lib/utils";

export default function AcademyModulesPage() {
  const params = useParams<{ key: string }>();
  const academyKey = params.key;
  const { data: modulesRes, loading, error, refetch } = useFetch<{ modules: AcademyModule[] }>(
    `/api/business/academies/${academyKey}/modules`
  );
  const modules = modulesRes?.modules;
  const [busyId, setBusyId] = useState<string | null>(null);
  const [completedLocal, setCompletedLocal] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (modules) {
      setCompletedLocal((prev) => {
        const next = new Set(prev);
        for (const m of modules) if (m.completed) next.add(m.id);
        return next;
      });
    }
  }, [modules]);

  const sorted = (modules ?? []).slice().sort((a, b) => a.order - b.order);
  const completedCount = sorted.filter((m) => completedLocal.has(m.id)).length;

  const markComplete = async (moduleId: string) => {
    setBusyId(moduleId);
    try {
      await apiPost(`/api/business/academies/${academyKey}/modules/${moduleId}/complete`, {});
      setCompletedLocal((prev) => new Set(prev).add(moduleId));
      refetch();
    } catch {
      // keep module visible; user can retry
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader title={`${titleCase(academyKey)} Academy`} subtitle="Work through modules at your own pace." />

      <GlassCard className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-[var(--color-accent)]" />
          <h2 className="font-semibold text-[var(--color-text-primary)]">Your progress</h2>
        </div>
        <ProgressBar value={completedCount} max={sorted.length || 1} label={`${completedCount}/${sorted.length} modules`} showPercentage />
      </GlassCard>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : sorted.length === 0 ? (
        <EmptyState title="No modules published yet" icon={GraduationCap} />
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((mod) => {
            const done = completedLocal.has(mod.id);
            return (
              <GlassCard key={mod.id} className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">{mod.title}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{mod.summary}</p>
                </div>
                <button
                  onClick={() => !done && markComplete(mod.id)}
                  disabled={done || busyId === mod.id}
                  aria-label={done ? "Module completed" : "Mark module complete"}
                  className="shrink-0"
                >
                  {done ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <Circle className="h-6 w-6 text-[var(--color-text-secondary)]" />
                  )}
                </button>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

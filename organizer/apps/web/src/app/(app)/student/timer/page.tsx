"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Square, Timer as TimerIcon } from "lucide-react";
import type { StudySession } from "@organizer/shared";
import { SUBJECTS } from "@organizer/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useFetch } from "@/lib/hooks";
import { apiPost, ApiError } from "@/lib/api";
import { formatDate, titleCase } from "@/lib/utils";

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function TimerPage() {
  const { data: sessions, loading, error, refetch } = useFetch<StudySession[]>("/api/student/study-sessions");
  const [subject, setSubject] = useState<string>(SUBJECTS[0]!);
  const [active, setActive] = useState<StudySession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    const startedAt = new Date(active.startedAt).getTime();
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  const start = async () => {
    setStarting(true);
    setActionError(null);
    try {
      const session = await apiPost<StudySession>("/api/student/study-sessions/start", { subject });
      setActive(session);
      setElapsed(0);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not start session.");
    } finally {
      setStarting(false);
    }
  };

  const stop = async () => {
    if (!active) return;
    setEnding(true);
    setActionError(null);
    try {
      await apiPost<StudySession>(`/api/student/study-sessions/${active.id}/end`, {});
      setActive(null);
      setElapsed(0);
      refetch();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not end session.");
    } finally {
      setEnding(false);
    }
  };

  const recent = (sessions ?? [])
    .filter((s) => s.endedAt)
    .slice()
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 10);

  return (
    <div>
      <PageHeader title="Study Timer" subtitle="Focus with a live timer and track your study sessions." />

      <GlassCard className="mb-6 flex flex-col items-center gap-4 py-10 text-center">
        <TimerIcon className="h-8 w-8 text-[var(--color-accent)]" />
        <p className="font-mono text-5xl font-bold text-[var(--color-text-primary)]">{formatElapsed(elapsed)}</p>
        {!active && (
          <div className="w-full max-w-xs">
            <Select
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              options={SUBJECTS.map((s) => ({ value: s, label: titleCase(s) }))}
            />
          </div>
        )}
        {actionError && <p className="text-sm font-medium text-red-500">{actionError}</p>}
        {active ? (
          <Button variant="danger" onClick={stop} loading={ending}>
            <Square className="h-4 w-4" /> Stop session
          </Button>
        ) : (
          <Button onClick={start} loading={starting}>
            <Play className="h-4 w-4" /> Start studying {titleCase(subject)}
          </Button>
        )}
      </GlassCard>

      <GlassCard>
        <h2 className="mb-3 font-semibold text-[var(--color-text-primary)]">Recent sessions</h2>
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : recent.length === 0 ? (
          <EmptyState title="No completed sessions yet" icon={TimerIcon} />
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.map((s) => (
              <li key={s.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-[var(--color-text-primary)]">{s.subject ? titleCase(s.subject) : "General"}</span>
                <span className="text-[var(--color-text-secondary)]">
                  {s.durationMinutes} min · {formatDate(s.startedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}

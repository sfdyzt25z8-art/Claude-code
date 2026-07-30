"use client";

import Link from "next/link";
import { useState } from "react";
import { Activity, Check, Flame, Target } from "lucide-react";
import type { Habit, HabitLog, PersonalGoal } from "@organizer/shared";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { useFetch } from "@/lib/hooks";
import { apiPost, ApiError } from "@/lib/api";
import { titleCase } from "@/lib/utils";

export function PersonalDashboard() {
  const { data: habitsRes, loading: habitsLoading, refetch: refetchHabits } = useFetch<{ habits: Habit[] }>(
    "/api/personal/habits"
  );
  const habits = habitsRes?.habits;
  const { data: goalsRes, loading: goalsLoading } = useFetch<{ goals: PersonalGoal[] }>("/api/personal/goals");
  const goals = goalsRes?.goals;
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [loggedToday, setLoggedToday] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const activeHabits = (habits ?? []).filter((h) => !h.archived);
  const activeGoals = (goals ?? []).filter((g) => !g.completed);

  const handleLog = async (habit: Habit) => {
    setLoggingId(habit.id);
    setError(null);
    try {
      await apiPost<HabitLog>(`/api/personal/habits/${habit.id}/log`, { completed: true });
      setLoggedToday((prev) => new Set(prev).add(habit.id));
      refetchHabits();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not log habit.");
    } finally {
      setLoggingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <GlassCard>
        <div className="mb-3 flex items-center gap-2">
          <Flame className="h-5 w-5 text-[var(--color-accent)]" />
          <h2 className="font-semibold text-[var(--color-text-primary)]">Today&apos;s habits</h2>
        </div>
        {error && <p className="mb-2 text-sm font-medium text-red-500">{error}</p>}
        {habitsLoading ? (
          <LoadingSpinner />
        ) : activeHabits.length === 0 ? (
          <EmptyState
            title="No habits yet"
            description="Create a habit to start building momentum."
            icon={Flame}
            action={
              <Link href="/personal/habits">
                <Button size="sm">Add a habit</Button>
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {activeHabits.map((habit) => {
              const done = loggedToday.has(habit.id);
              return (
                <li
                  key={habit.id}
                  className="flex items-center justify-between rounded-xl border px-4 py-3"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">{habit.title}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {titleCase(habit.frequency)} · target {habit.targetCount}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={done ? "secondary" : "outline"}
                    loading={loggingId === habit.id}
                    onClick={() => handleLog(habit)}
                    disabled={done}
                  >
                    {done ? <Check className="h-4 w-4" /> : "Log today"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        <Link href="/personal/habits" className="mt-4 inline-block text-xs font-medium text-[var(--color-accent)] hover:underline">
          Manage habits →
        </Link>
      </GlassCard>

      <GlassCard>
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-5 w-5 text-[var(--color-accent)]" />
          <h2 className="font-semibold text-[var(--color-text-primary)]">Personal goals</h2>
        </div>
        {goalsLoading ? (
          <LoadingSpinner />
        ) : activeGoals.length === 0 ? (
          <EmptyState title="No active goals" icon={Target} />
        ) : (
          <ul className="flex flex-col gap-4">
            {activeGoals.slice(0, 5).map((g) => (
              <li key={g.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-[var(--color-text-primary)]">{g.title}</span>
                  <Badge tone="accent">{titleCase(g.focus)}</Badge>
                </div>
                {g.targetValue !== null && g.currentValue !== null && (
                  <ProgressBar value={g.currentValue} max={g.targetValue} label={g.unit ?? undefined} />
                )}
              </li>
            ))}
          </ul>
        )}
        <Link href="/personal/goals" className="mt-4 inline-block text-xs font-medium text-[var(--color-accent)] hover:underline">
          View all goals →
        </Link>
      </GlassCard>

      <GlassCard>
        <div className="mb-3 flex items-center gap-2">
          <Activity className="h-5 w-5 text-[var(--color-accent)]" />
          <h2 className="font-semibold text-[var(--color-text-primary)]">Wellness summary</h2>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">
          You have {activeHabits.length} active habit{activeHabits.length === 1 ? "" : "s"} and {activeGoals.length} goal
          {activeGoals.length === 1 ? "" : "s"} in progress. Keep showing up — small steps compound.
        </p>
        <Link href="/personal/progress" className="mt-4 inline-block text-xs font-medium text-[var(--color-accent)] hover:underline">
          See full progress →
        </Link>
      </GlassCard>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Flame, Check, Archive } from "lucide-react";
import { PERSONAL_FOCUS_OPTIONS, type Habit, type HabitLog } from "@organizer/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useFetch } from "@/lib/hooks";
import { apiPatch, apiPost, ApiError } from "@/lib/api";
import { titleCase } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(2, "Give it a title"),
  focus: z.string().optional(),
  frequency: z.enum(["daily", "weekly"]),
  targetCount: z.coerce.number().min(1, "At least 1"),
});
type FormValues = z.infer<typeof schema>;

export default function HabitsPage() {
  const { data: habitsRes, loading, error, refetch } = useFetch<{ habits: Habit[] }>("/api/personal/habits");
  const habits = habitsRes?.habits;
  const [modalOpen, setModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loggedToday, setLoggedToday] = useState<Set<string>>(new Set());

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { frequency: "daily", targetCount: 1 } });

  const onCreate = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await apiPost<Habit>("/api/personal/habits", values);
      reset({ frequency: "daily", targetCount: 1 });
      setModalOpen(false);
      refetch();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not add habit.");
    }
  };

  const logHabit = async (habit: Habit) => {
    setBusyId(habit.id);
    try {
      await apiPost<HabitLog>(`/api/personal/habits/${habit.id}/log`, { completed: true });
      setLoggedToday((prev) => new Set(prev).add(habit.id));
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not log habit.");
    } finally {
      setBusyId(null);
    }
  };

  const archiveHabit = async (habit: Habit) => {
    setBusyId(habit.id);
    try {
      await apiPatch<Habit>(`/api/personal/habits/${habit.id}`, { archived: true });
      refetch();
    } finally {
      setBusyId(null);
    }
  };

  const active = (habits ?? []).filter((h) => !h.archived);

  return (
    <div>
      <PageHeader
        title="Habits"
        subtitle="Build momentum with daily and weekly habits."
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add habit
          </Button>
        }
      />

      {submitError && <p className="mb-3 text-sm font-medium text-red-500">{submitError}</p>}

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : active.length === 0 ? (
        <EmptyState title="No habits yet" icon={Flame} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((habit) => {
            const done = loggedToday.has(habit.id);
            return (
              <GlassCard key={habit.id}>
                <div className="mb-2 flex items-start justify-between">
                  <p className="font-semibold text-[var(--color-text-primary)]">{habit.title}</p>
                  <button
                    onClick={() => archiveHabit(habit)}
                    aria-label="Archive habit"
                    disabled={busyId === habit.id}
                    className="text-[var(--color-text-secondary)] hover:text-red-500"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                </div>
                <p className="mb-3 text-xs text-[var(--color-text-secondary)]">
                  {titleCase(habit.frequency)} · target {habit.targetCount}
                  {habit.focus ? ` · ${titleCase(habit.focus)}` : ""}
                </p>
                <Button size="sm" variant={done ? "secondary" : "outline"} loading={busyId === habit.id} disabled={done} onClick={() => logHabit(habit)} fullWidth>
                  {done ? <Check className="h-4 w-4" /> : "Log today"}
                </Button>
              </GlassCard>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add habit">
        <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-4" noValidate>
          <Input label="Title" placeholder="Drink 8 glasses of water" error={errors.title?.message} {...register("title")} />
          <Select
            label="Focus (optional)"
            options={PERSONAL_FOCUS_OPTIONS.map((f) => ({ value: f, label: titleCase(f) }))}
            placeholder="No specific focus"
            {...register("focus")}
          />
          <Select
            label="Frequency"
            options={[
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
            ]}
            {...register("frequency")}
          />
          <Input label="Target count" type="number" error={errors.targetCount?.message} {...register("targetCount")} />
          <Button type="submit" fullWidth loading={isSubmitting}>
            Save habit
          </Button>
        </form>
      </Modal>
    </div>
  );
}

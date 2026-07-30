"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Target, Check } from "lucide-react";
import { PERSONAL_FOCUS_OPTIONS, type PersonalGoal } from "@organizer/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useFetch } from "@/lib/hooks";
import { apiPatch, apiPost, ApiError } from "@/lib/api";
import { formatDate, titleCase } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(2, "Give it a title"),
  focus: z.string().min(1, "Choose a focus"),
  targetValue: z.coerce.number().optional(),
  currentValue: z.coerce.number().optional(),
  unit: z.string().optional(),
  dueDate: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function PersonalGoalsPage() {
  const { data: goalsRes, loading, error, refetch } = useFetch<{ goals: PersonalGoal[] }>("/api/personal/goals");
  const goals = goalsRes?.goals;
  const [modalOpen, setModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onCreate = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await apiPost<PersonalGoal>("/api/personal/goals", values);
      reset();
      setModalOpen(false);
      refetch();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not add goal.");
    }
  };

  const markComplete = async (goal: PersonalGoal) => {
    setBusyId(goal.id);
    try {
      await apiPatch<PersonalGoal>(`/api/personal/goals/${goal.id}`, { completed: true });
      refetch();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Personal Goals"
        subtitle="Set meaningful goals across the areas you care about."
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add goal
          </Button>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (goals ?? []).length === 0 ? (
        <EmptyState title="No goals yet" icon={Target} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(goals ?? []).map((g) => (
            <GlassCard key={g.id}>
              <div className="mb-2 flex items-start justify-between">
                <p className="font-semibold text-[var(--color-text-primary)]">{g.title}</p>
                {g.completed ? (
                  <span className="text-emerald-500">
                    <Check className="h-4 w-4" />
                  </span>
                ) : (
                  <Button size="sm" variant="outline" loading={busyId === g.id} onClick={() => markComplete(g)}>
                    Complete
                  </Button>
                )}
              </div>
              <Badge tone="accent">{titleCase(g.focus)}</Badge>
              {g.targetValue !== null && g.currentValue !== null && (
                <div className="mt-3">
                  <ProgressBar value={g.currentValue ?? 0} max={g.targetValue ?? 1} label={g.unit ?? undefined} />
                </div>
              )}
              {g.dueDate && <p className="mt-2 text-xs text-[var(--color-text-secondary)]">Due {formatDate(g.dueDate)}</p>}
            </GlassCard>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add personal goal">
        <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-4" noValidate>
          <Input label="Title" placeholder="Run a 5k" error={errors.title?.message} {...register("title")} />
          <Select
            label="Focus area"
            options={PERSONAL_FOCUS_OPTIONS.map((f) => ({ value: f, label: titleCase(f) }))}
            placeholder="Select a focus"
            error={errors.focus?.message}
            {...register("focus")}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Current value (optional)" type="number" {...register("currentValue")} />
            <Input label="Target value (optional)" type="number" {...register("targetValue")} />
          </div>
          <Input label="Unit (optional)" placeholder="km, books, days" {...register("unit")} />
          <Input label="Due date (optional)" type="date" {...register("dueDate")} />
          {submitError && <p className="text-sm font-medium text-red-500">{submitError}</p>}
          <Button type="submit" fullWidth loading={isSubmitting}>
            Save goal
          </Button>
        </form>
      </Modal>
    </div>
  );
}

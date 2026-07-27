"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Target, Check } from "lucide-react";
import type { BusinessGoal } from "@organizer/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useFetch } from "@/lib/hooks";
import { apiPatch, apiPost, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(2, "Give it a title"),
  targetValue: z.coerce.number().positive("Target must be positive"),
  currentValue: z.coerce.number().min(0).default(0),
  unit: z.string().min(1, "Add a unit (e.g. USD, clients)"),
  dueDate: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function BusinessGoalsPage() {
  const { data: goals, loading, error, refetch } = useFetch<BusinessGoal[]>("/api/business/goals");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { currentValue: 0 } });

  const onCreate = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await apiPost<BusinessGoal>("/api/business/goals", values);
      reset({ currentValue: 0 });
      setModalOpen(false);
      refetch();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not add goal.");
    }
  };

  const markComplete = async (goal: BusinessGoal) => {
    setBusyId(goal.id);
    try {
      await apiPatch<BusinessGoal>(`/api/business/goals/${goal.id}`, { completed: true, currentValue: goal.targetValue });
      refetch();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Business Goals"
        subtitle="Set measurable targets and track your progress."
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
                  <span className="text-emerald-500"><Check className="h-4 w-4" /></span>
                ) : (
                  <Button size="sm" variant="outline" loading={busyId === g.id} onClick={() => markComplete(g)}>
                    Complete
                  </Button>
                )}
              </div>
              <ProgressBar value={g.currentValue} max={g.targetValue} label={`${g.currentValue}/${g.targetValue} ${g.unit}`} />
              {g.dueDate && <p className="mt-2 text-xs text-[var(--color-text-secondary)]">Due {formatDate(g.dueDate)}</p>}
            </GlassCard>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add business goal">
        <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-4" noValidate>
          <Input label="Title" placeholder="Reach $10k MRR" error={errors.title?.message} {...register("title")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Current value" type="number" step="0.01" error={errors.currentValue?.message} {...register("currentValue")} />
            <Input label="Target value" type="number" step="0.01" error={errors.targetValue?.message} {...register("targetValue")} />
          </div>
          <Input label="Unit" placeholder="USD" error={errors.unit?.message} {...register("unit")} />
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

"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Clock } from "lucide-react";
import type { StudyPlanItem } from "@organizer/shared";
import { SUBJECTS } from "@organizer/shared";
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
import { formatDate, titleCase } from "@/lib/utils";

const schema = z.object({
  subject: z.string().min(1, "Choose a subject"),
  title: z.string().min(2, "Give it a title"),
  scheduledAt: z.string().min(1, "Pick a date & time"),
  durationMinutes: z.coerce.number().min(5, "At least 5 minutes"),
});
type FormValues = z.infer<typeof schema>;

export default function PlannerPage() {
  const { data: planRes, loading, error, refetch } = useFetch<{ studyPlanItems: StudyPlanItem[] }>("/api/student/study-plan");
  const plan = planRes?.studyPlanItems;
  const [modalOpen, setModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { durationMinutes: 30 } });

  const onCreate = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await apiPost<StudyPlanItem>("/api/student/study-plan", values);
      reset({ durationMinutes: 30 });
      setModalOpen(false);
      refetch();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not add plan item.");
    }
  };

  const toggleComplete = async (item: StudyPlanItem) => {
    setBusyId(item.id);
    try {
      await apiPatch<StudyPlanItem>(`/api/student/study-plan/${item.id}`, { completed: !item.completed });
      refetch();
    } finally {
      setBusyId(null);
    }
  };

  const grouped = useMemo(() => {
    const groups = new Map<string, StudyPlanItem[]>();
    for (const item of (plan ?? []).slice().sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())) {
      const key = formatDate(item.scheduledAt, { weekday: "long", month: "short", day: "numeric" });
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return Array.from(groups.entries());
  }, [plan]);

  return (
    <div>
      <PageHeader
        title="Study Planner"
        subtitle="Plan focused study sessions across your subjects."
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add session
          </Button>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : grouped.length === 0 ? (
        <EmptyState title="No study sessions planned" icon={Clock} />
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(([day, items]) => (
            <div key={day}>
              <h2 className="mb-2 text-sm font-semibold text-[var(--color-text-secondary)]">{day}</h2>
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <GlassCard key={item.id} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleComplete(item)}
                        disabled={busyId === item.id}
                        className="h-4 w-4 accent-[var(--color-accent)]"
                        aria-label={`Mark ${item.title} complete`}
                      />
                      <div>
                        <p className={`font-medium text-[var(--color-text-primary)] ${item.completed ? "line-through opacity-60" : ""}`}>
                          {item.title}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          {titleCase(item.subject)} · {formatDate(item.scheduledAt, { hour: "numeric", minute: "2-digit" })} ·{" "}
                          {item.durationMinutes} min
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add study session">
        <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-4" noValidate>
          <Select
            label="Subject"
            options={SUBJECTS.map((s) => ({ value: s, label: titleCase(s) }))}
            placeholder="Select a subject"
            error={errors.subject?.message}
            {...register("subject")}
          />
          <Input label="Title" placeholder="Review chapter 3" error={errors.title?.message} {...register("title")} />
          <Input label="Scheduled at" type="datetime-local" error={errors.scheduledAt?.message} {...register("scheduledAt")} />
          <Input label="Duration (minutes)" type="number" error={errors.durationMinutes?.message} {...register("durationMinutes")} />
          {submitError && <p className="text-sm font-medium text-red-500">{submitError}</p>}
          <Button type="submit" fullWidth loading={isSubmitting}>
            Save session
          </Button>
        </form>
      </Modal>
    </div>
  );
}

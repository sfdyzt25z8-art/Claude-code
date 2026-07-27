"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import type { Homework } from "@organizer/shared";
import { SUBJECTS } from "@organizer/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useFetch } from "@/lib/hooks";
import { apiPatch, apiPost, apiDelete, ApiError } from "@/lib/api";
import { daysUntil, formatDate, titleCase } from "@/lib/utils";

const schema = z.object({
  subject: z.string().min(1, "Choose a subject"),
  title: z.string().min(2, "Give it a title"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "Pick a due date"),
});
type FormValues = z.infer<typeof schema>;

export default function HomeworkPage() {
  const { data: homework, loading, error, refetch } = useFetch<Homework[]>("/api/student/homework");
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
      await apiPost<Homework>("/api/student/homework", values);
      reset();
      setModalOpen(false);
      refetch();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not create homework.");
    }
  };

  const toggleComplete = async (item: Homework) => {
    setBusyId(item.id);
    try {
      await apiPatch<Homework>(`/api/student/homework/${item.id}`, { completed: !item.completed });
      refetch();
    } catch {
      // no-op, list stays as-is; user can retry
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item: Homework) => {
    setBusyId(item.id);
    try {
      await apiDelete(`/api/student/homework/${item.id}`);
      refetch();
    } catch {
      // ignore, keep item visible on failure
    } finally {
      setBusyId(null);
    }
  };

  const sorted = (homework ?? []).slice().sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div>
      <PageHeader
        title="Homework"
        subtitle="Track assignments and stay ahead of deadlines."
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add homework
          </Button>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : sorted.length === 0 ? (
        <EmptyState title="No homework yet" description="Add your first assignment to get started." icon={Plus} />
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((item) => {
            const days = daysUntil(item.dueDate);
            return (
              <GlassCard key={item.id} className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleComplete(item)}
                    disabled={busyId === item.id}
                    aria-label={`Mark ${item.title} as ${item.completed ? "incomplete" : "complete"}`}
                    className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
                  />
                  <div>
                    <p className={`font-medium text-[var(--color-text-primary)] ${item.completed ? "line-through opacity-60" : ""}`}>
                      {item.title}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {titleCase(item.subject)} · Due {formatDate(item.dueDate)}
                    </p>
                    {item.description && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{item.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!item.completed && days !== null && (
                    <Badge tone={days <= 1 ? "danger" : days <= 3 ? "warning" : "neutral"}>
                      {days <= 0 ? "Due today" : `${days}d left`}
                    </Badge>
                  )}
                  <button
                    onClick={() => remove(item)}
                    aria-label={`Delete ${item.title}`}
                    className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add homework">
        <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-4" noValidate>
          <Select
            label="Subject"
            options={SUBJECTS.map((s) => ({ value: s, label: titleCase(s) }))}
            placeholder="Select a subject"
            error={errors.subject?.message}
            {...register("subject")}
          />
          <Input label="Title" placeholder="Read chapter 4" error={errors.title?.message} {...register("title")} />
          <Input label="Description (optional)" {...register("description")} />
          <Input label="Due date" type="date" error={errors.dueDate?.message} {...register("dueDate")} />
          {submitError && <p className="text-sm font-medium text-red-500">{submitError}</p>}
          <Button type="submit" fullWidth loading={isSubmitting}>
            Save homework
          </Button>
        </form>
      </Modal>
    </div>
  );
}

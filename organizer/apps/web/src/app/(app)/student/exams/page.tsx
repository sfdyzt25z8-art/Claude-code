"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, GraduationCap, MapPin } from "lucide-react";
import type { Exam } from "@organizer/shared";
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
import { apiPost, ApiError } from "@/lib/api";
import { daysUntil, formatDate, titleCase } from "@/lib/utils";

const schema = z.object({
  subject: z.string().min(1, "Choose a subject"),
  title: z.string().min(2, "Give it a title"),
  date: z.string().min(1, "Pick a date"),
  location: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function ExamsPage() {
  const { data: examsRes, loading, error, refetch } = useFetch<{ exams: Exam[] }>("/api/student/exams/countdown");
  const exams = examsRes?.exams;
  const [modalOpen, setModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onCreate = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await apiPost<Exam>("/api/student/exams", values);
      reset();
      setModalOpen(false);
      refetch();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not add exam.");
    }
  };

  const sorted = (exams ?? []).slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div>
      <PageHeader
        title="Exams"
        subtitle="Keep track of upcoming exams and how much time you have left."
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add exam
          </Button>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : sorted.length === 0 ? (
        <EmptyState title="No exams scheduled" icon={GraduationCap} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((exam) => {
            const days = daysUntil(exam.date);
            return (
              <GlassCard key={exam.id} hoverable>
                <div className="mb-3 flex items-start justify-between">
                  <GraduationCap className="h-6 w-6 text-[var(--color-accent)]" />
                  <Badge tone={days !== null && days <= 3 ? "danger" : days !== null && days <= 7 ? "warning" : "accent"}>
                    {days === null ? "—" : days <= 0 ? "Today" : `${days} days`}
                  </Badge>
                </div>
                <p className="font-semibold text-[var(--color-text-primary)]">{exam.title}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{titleCase(exam.subject)}</p>
                <p className="mt-2 text-xs text-[var(--color-text-secondary)]">{formatDate(exam.date)}</p>
                {exam.location && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                    <MapPin className="h-3 w-3" /> {exam.location}
                  </p>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add exam">
        <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-4" noValidate>
          <Select
            label="Subject"
            options={SUBJECTS.map((s) => ({ value: s, label: titleCase(s) }))}
            placeholder="Select a subject"
            error={errors.subject?.message}
            {...register("subject")}
          />
          <Input label="Title" placeholder="Midterm exam" error={errors.title?.message} {...register("title")} />
          <Input label="Date" type="date" error={errors.date?.message} {...register("date")} />
          <Input label="Location (optional)" {...register("location")} />
          {submitError && <p className="text-sm font-medium text-red-500">{submitError}</p>}
          <Button type="submit" fullWidth loading={isSubmitting}>
            Save exam
          </Button>
        </form>
      </Modal>
    </div>
  );
}

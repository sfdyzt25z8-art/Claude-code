"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Plus } from "lucide-react";
import type { GradeEntry } from "@organizer/shared";
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
import { apiPost, ApiError } from "@/lib/api";
import { formatDate, titleCase } from "@/lib/utils";

const schema = z.object({
  subject: z.string().min(1, "Choose a subject"),
  assignmentName: z.string().min(2, "Name the assignment"),
  score: z.coerce.number().min(0, "Score can't be negative"),
  maxScore: z.coerce.number().min(1, "Max score must be positive"),
  weight: z.coerce.number().min(0).max(1).default(1),
  date: z.string().min(1, "Pick a date"),
});
type FormValues = z.infer<typeof schema>;

export default function GradebookPage() {
  const { data: grades, loading, error, refetch } = useFetch<GradeEntry[]>("/api/student/grades");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { weight: 1 } });

  const onCreate = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await apiPost<GradeEntry>("/api/student/grades", values);
      reset({ weight: 1 });
      setModalOpen(false);
      refetch();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not save grade.");
    }
  };

  const subjectAverages = useMemo(() => {
    const bySubject = new Map<string, { weightedScore: number; weightTotal: number }>();
    for (const g of grades ?? []) {
      const pct = (g.score / g.maxScore) * 100;
      const bucket = bySubject.get(g.subject) ?? { weightedScore: 0, weightTotal: 0 };
      bucket.weightedScore += pct * (g.weight || 1);
      bucket.weightTotal += g.weight || 1;
      bySubject.set(g.subject, bucket);
    }
    return SUBJECTS.filter((s) => bySubject.has(s)).map((s) => {
      const bucket = bySubject.get(s)!;
      return { subject: titleCase(s), average: Math.round(bucket.weightedScore / bucket.weightTotal) };
    });
  }, [grades]);

  const sortedGrades = (grades ?? []).slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div>
      <PageHeader
        title="Gradebook"
        subtitle="Log assignment scores and track subject averages."
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add grade
          </Button>
        }
      />

      <GlassCard className="mb-6">
        <h2 className="mb-3 font-semibold text-[var(--color-text-primary)]">Subject averages</h2>
        {loading ? (
          <LoadingSpinner />
        ) : subjectAverages.length === 0 ? (
          <EmptyState title="No grades logged yet" icon={Plus} />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectAverages}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="subject" stroke="var(--color-text-secondary)" fontSize={12} />
                <YAxis stroke="var(--color-text-secondary)" fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                <Bar dataKey="average" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <h2 className="mb-3 font-semibold text-[var(--color-text-primary)]">All entries</h2>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {sortedGrades.length === 0 && !loading ? (
          <EmptyState title="No entries yet" icon={Plus} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-[var(--color-text-secondary)]">
                  <th className="pb-2 pr-4">Assignment</th>
                  <th className="pb-2 pr-4">Subject</th>
                  <th className="pb-2 pr-4">Score</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {sortedGrades.map((g) => (
                  <tr key={g.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                    <td className="py-2 pr-4 font-medium text-[var(--color-text-primary)]">{g.assignmentName}</td>
                    <td className="py-2 pr-4 text-[var(--color-text-secondary)]">{titleCase(g.subject)}</td>
                    <td className="py-2 pr-4 text-[var(--color-text-secondary)]">
                      {g.score}/{g.maxScore} ({Math.round((g.score / g.maxScore) * 100)}%)
                    </td>
                    <td className="py-2 text-[var(--color-text-secondary)]">{formatDate(g.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add grade">
        <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-4" noValidate>
          <Select
            label="Subject"
            options={SUBJECTS.map((s) => ({ value: s, label: titleCase(s) }))}
            placeholder="Select a subject"
            error={errors.subject?.message}
            {...register("subject")}
          />
          <Input label="Assignment name" error={errors.assignmentName?.message} {...register("assignmentName")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Score" type="number" step="0.1" error={errors.score?.message} {...register("score")} />
            <Input label="Max score" type="number" step="0.1" error={errors.maxScore?.message} {...register("maxScore")} />
          </div>
          <Input label="Weight (0-1)" type="number" step="0.1" min={0} max={1} error={errors.weight?.message} {...register("weight")} />
          <Input label="Date" type="date" error={errors.date?.message} {...register("date")} />
          {submitError && <p className="text-sm font-medium text-red-500">{submitError}</p>}
          <Button type="submit" fullWidth loading={isSubmitting}>
            Save grade
          </Button>
        </form>
      </Modal>
    </div>
  );
}

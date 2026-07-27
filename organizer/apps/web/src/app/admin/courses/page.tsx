"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, GraduationCap } from "lucide-react";
import { ACADEMIES, type AdminCourse } from "@organizer/shared";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useFetch } from "@/lib/hooks";
import { apiPatch, apiPost, ApiError } from "@/lib/api";
import { formatDate, titleCase } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(2, "Give it a title"),
  academy: z.string().min(1, "Choose an academy"),
});
type FormValues = z.infer<typeof schema>;

export default function AdminCoursesPage() {
  const { data: courses, loading, error, refetch } = useFetch<AdminCourse[]>("/api/admin/courses");
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
      await apiPost<AdminCourse>("/api/admin/courses", { ...values, published: false });
      reset();
      setModalOpen(false);
      refetch();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not create course.");
    }
  };

  const togglePublished = async (course: AdminCourse) => {
    setBusyId(course.id);
    try {
      await apiPatch<AdminCourse>(`/api/admin/courses/${course.id}`, { published: !course.published });
      refetch();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Courses</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> Add course
        </Button>
      </div>

      <GlassCard>
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (courses ?? []).length === 0 ? (
          <EmptyState title="No courses yet" icon={GraduationCap} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-[var(--color-text-secondary)]">
                  <th className="pb-2 pr-4">Title</th>
                  <th className="pb-2 pr-4">Academy</th>
                  <th className="pb-2 pr-4">Created</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {(courses ?? []).map((c) => (
                  <tr key={c.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                    <td className="py-2 pr-4 font-medium text-[var(--color-text-primary)]">{c.title}</td>
                    <td className="py-2 pr-4 text-[var(--color-text-secondary)]">{titleCase(c.academy)}</td>
                    <td className="py-2 pr-4 text-[var(--color-text-secondary)]">{formatDate(c.createdAt)}</td>
                    <td className="py-2 pr-4">
                      <Badge tone={c.published ? "success" : "neutral"}>{c.published ? "Published" : "Draft"}</Badge>
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => togglePublished(c)}
                        disabled={busyId === c.id}
                        className="rounded-lg border px-2 py-1 text-xs font-medium hover:bg-[var(--color-surface-glass)]"
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        {c.published ? "Unpublish" : "Publish"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add course">
        <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-4" noValidate>
          <Input label="Title" error={errors.title?.message} {...register("title")} />
          <Select
            label="Academy"
            options={ACADEMIES.map((a) => ({ value: a, label: titleCase(a) }))}
            placeholder="Select academy"
            error={errors.academy?.message}
            {...register("academy")}
          />
          {submitError && <p className="text-sm font-medium text-red-500">{submitError}</p>}
          <Button type="submit" fullWidth loading={isSubmitting}>
            Save course
          </Button>
        </form>
      </Modal>
    </div>
  );
}

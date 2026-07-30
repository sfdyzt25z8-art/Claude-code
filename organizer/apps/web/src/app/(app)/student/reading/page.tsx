"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, BookOpen } from "lucide-react";
import type { ReadingEntry } from "@organizer/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useFetch } from "@/lib/hooks";
import { apiPatch, apiPost, ApiError } from "@/lib/api";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().optional(),
  totalPages: z.coerce.number().min(1).optional(),
  status: z.enum(["reading", "completed", "wishlist"]),
});
type FormValues = z.infer<typeof schema>;

const statusTone = { reading: "accent", completed: "success", wishlist: "neutral" } as const;

export default function ReadingPage() {
  const { data: readingRes, loading, error, refetch } = useFetch<{ reading: ReadingEntry[] }>("/api/student/reading");
  const books = readingRes?.reading;
  const [modalOpen, setModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { status: "reading" } });

  const onCreate = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await apiPost<ReadingEntry>("/api/student/reading", values);
      reset({ status: "reading" });
      setModalOpen(false);
      refetch();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not add book.");
    }
  };

  const bumpPages = async (entry: ReadingEntry, delta: number) => {
    setBusyId(entry.id);
    const nextPages = Math.max(0, entry.pagesRead + delta);
    try {
      await apiPatch<ReadingEntry>(`/api/student/reading/${entry.id}`, { pagesRead: nextPages });
      refetch();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Reading"
        subtitle="Track books you're reading, finished, or want to read."
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add book
          </Button>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (books ?? []).length === 0 ? (
        <EmptyState title="No books yet" icon={BookOpen} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(books ?? []).map((entry) => (
            <GlassCard key={entry.id}>
              <div className="mb-2 flex items-start justify-between">
                <BookOpen className="h-5 w-5 text-[var(--color-accent)]" />
                <Badge tone={statusTone[entry.status]}>{entry.status}</Badge>
              </div>
              <p className="font-semibold text-[var(--color-text-primary)]">{entry.title}</p>
              {entry.author && <p className="text-xs text-[var(--color-text-secondary)]">{entry.author}</p>}
              {entry.status === "reading" && (
                <div className="mt-3">
                  <ProgressBar
                    value={entry.pagesRead}
                    max={entry.totalPages ?? (entry.pagesRead || 1)}
                    label={`${entry.pagesRead}/${entry.totalPages ?? "?"} pages`}
                  />
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" loading={busyId === entry.id} onClick={() => bumpPages(entry, -10)}>
                      -10
                    </Button>
                    <Button size="sm" variant="outline" loading={busyId === entry.id} onClick={() => bumpPages(entry, 10)}>
                      +10 pages
                    </Button>
                  </div>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add book">
        <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-4" noValidate>
          <Input label="Title" error={errors.title?.message} {...register("title")} />
          <Input label="Author (optional)" {...register("author")} />
          <Input label="Total pages (optional)" type="number" {...register("totalPages")} />
          <Select
            label="Status"
            options={[
              { value: "reading", label: "Reading" },
              { value: "completed", label: "Completed" },
              { value: "wishlist", label: "Wishlist" },
            ]}
            {...register("status")}
          />
          {submitError && <p className="text-sm font-medium text-red-500">{submitError}</p>}
          <Button type="submit" fullWidth loading={isSubmitting}>
            Save book
          </Button>
        </form>
      </Modal>
    </div>
  );
}

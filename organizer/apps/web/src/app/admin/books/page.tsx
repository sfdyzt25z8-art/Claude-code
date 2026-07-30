"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, BookOpen } from "lucide-react";
import { SUBJECTS, type AdminBook } from "@organizer/shared";
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
import { titleCase } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(2, "Give it a title"),
  author: z.string().min(1, "Add an author"),
  subject: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function AdminBooksPage() {
  const { data: booksRes, loading, error, refetch } = useFetch<{ books: AdminBook[] }>("/api/admin/books");
  const books = booksRes?.books;
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
      await apiPost<AdminBook>("/api/admin/books", { ...values, published: false });
      reset();
      setModalOpen(false);
      refetch();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not add book.");
    }
  };

  const togglePublished = async (book: AdminBook) => {
    setBusyId(book.id);
    try {
      await apiPatch<AdminBook>(`/api/admin/books/${book.id}`, { published: !book.published });
      refetch();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Books</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> Add book
        </Button>
      </div>

      <GlassCard>
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (books ?? []).length === 0 ? (
          <EmptyState title="No books yet" icon={BookOpen} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(books ?? []).map((b) => (
              <GlassCard key={b.id}>
                <div className="mb-2 flex items-start justify-between">
                  <p className="font-semibold text-[var(--color-text-primary)]">{b.title}</p>
                  <Badge tone={b.published ? "success" : "neutral"}>{b.published ? "Published" : "Draft"}</Badge>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">{b.author}</p>
                {b.subject && <p className="text-xs text-[var(--color-text-secondary)]">{titleCase(b.subject)}</p>}
                <button
                  onClick={() => togglePublished(b)}
                  disabled={busyId === b.id}
                  className="mt-3 rounded-lg border px-2 py-1 text-xs font-medium hover:bg-[var(--color-surface-glass)]"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  {b.published ? "Unpublish" : "Publish"}
                </button>
              </GlassCard>
            ))}
          </div>
        )}
      </GlassCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add book">
        <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-4" noValidate>
          <Input label="Title" error={errors.title?.message} {...register("title")} />
          <Input label="Author" error={errors.author?.message} {...register("author")} />
          <Select label="Subject (optional)" options={SUBJECTS.map((s) => ({ value: s, label: titleCase(s) }))} {...register("subject")} />
          {submitError && <p className="text-sm font-medium text-red-500">{submitError}</p>}
          <Button type="submit" fullWidth loading={isSubmitting}>
            Save book
          </Button>
        </form>
      </Modal>
    </div>
  );
}

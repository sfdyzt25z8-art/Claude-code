"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, PiggyBank } from "lucide-react";
import type { Budget, ExpenseEntry } from "@organizer/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks";
import { apiDelete, apiPost, ApiError } from "@/lib/api";
import { formatCurrency, titleCase } from "@/lib/utils";

const schema = z.object({
  category: z.string().min(1, "Add a category"),
  limit: z.coerce.number().positive("Limit must be positive"),
  period: z.enum(["weekly", "monthly", "yearly"]),
});
type FormValues = z.infer<typeof schema>;

export default function BudgetPage() {
  const { profile } = useAuth();
  const currency = profile?.currency ?? "USD";
  const { data: budgets, loading, error, refetch } = useFetch<Budget[]>("/api/business/budgets");
  const { data: expenses } = useFetch<ExpenseEntry[]>("/api/business/expenses");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { period: "monthly" } });

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses ?? []) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    return map;
  }, [expenses]);

  const onCreate = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await apiPost<Budget>("/api/business/budgets", { ...values, currency });
      reset({ period: "monthly" });
      setModalOpen(false);
      refetch();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not add budget.");
    }
  };

  const remove = async (id: string) => {
    await apiDelete(`/api/business/budgets/${id}`).catch(() => null);
    refetch();
  };

  return (
    <div>
      <PageHeader
        title="Budget"
        subtitle="Set spending limits by category and period."
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add budget
          </Button>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (budgets ?? []).length === 0 ? (
        <EmptyState title="No budgets set" icon={PiggyBank} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(budgets ?? []).map((b) => {
            const spent = spentByCategory.get(b.category) ?? 0;
            return (
              <GlassCard key={b.id}>
                <div className="mb-2 flex items-start justify-between">
                  <p className="font-semibold text-[var(--color-text-primary)]">{titleCase(b.category)}</p>
                  <button
                    onClick={() => remove(b.id)}
                    aria-label="Delete budget"
                    className="rounded-lg p-1 text-[var(--color-text-secondary)] hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="mb-2 text-xs text-[var(--color-text-secondary)]">{titleCase(b.period)} limit</p>
                <ProgressBar
                  value={spent}
                  max={b.limit}
                  colorClassName={spent > b.limit ? "bg-red-500" : undefined}
                  label={`${formatCurrency(spent, b.currency)} / ${formatCurrency(b.limit, b.currency)}`}
                />
              </GlassCard>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add budget">
        <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-4" noValidate>
          <Input label="Category" placeholder="Marketing" error={errors.category?.message} {...register("category")} />
          <Input label="Limit" type="number" step="0.01" error={errors.limit?.message} {...register("limit")} />
          <Select
            label="Period"
            options={[
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
              { value: "yearly", label: "Yearly" },
            ]}
            {...register("period")}
          />
          {submitError && <p className="text-sm font-medium text-red-500">{submitError}</p>}
          <Button type="submit" fullWidth loading={isSubmitting}>
            Save budget
          </Button>
        </form>
      </Modal>
    </div>
  );
}

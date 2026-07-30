"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import type { InvestmentEntry } from "@organizer/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks";
import { apiPost, ApiError } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  currentValue: z.coerce.number().min(0, "Current value can't be negative"),
  purchaseDate: z.string().min(1, "Pick a date"),
});
type FormValues = z.infer<typeof schema>;

interface SummaryResponse {
  totalInvested?: number;
  totalCurrentValue?: number;
  totalGain?: number;
}

export default function InvestmentsPage() {
  const { profile } = useAuth();
  const currency = profile?.currency ?? "USD";
  const { data: investmentsRes, loading, error, refetch } = useFetch<{ investments: InvestmentEntry[] }>(
    "/api/business/investments"
  );
  const investments = investmentsRes?.investments;
  const { data: summary } = useFetch<SummaryResponse>("/api/business/investments/summary");
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
      await apiPost<InvestmentEntry>("/api/business/investments", { ...values, currency });
      reset();
      setModalOpen(false);
      refetch();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not add investment.");
    }
  };

  const totalInvested = summary?.totalInvested ?? (investments ?? []).reduce((s, i) => s + i.amount, 0);
  const totalCurrent = summary?.totalCurrentValue ?? (investments ?? []).reduce((s, i) => s + i.currentValue, 0);
  const totalReturn = summary?.totalGain ?? totalCurrent - totalInvested;

  return (
    <div>
      <PageHeader
        title="Investments"
        subtitle="Track your business investment portfolio."
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add investment
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlassCard>
          <p className="text-xs text-[var(--color-text-secondary)]">Total invested</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{formatCurrency(totalInvested, currency)}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-[var(--color-text-secondary)]">Current value</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{formatCurrency(totalCurrent, currency)}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-[var(--color-text-secondary)]">Return</p>
          <p className={`mt-1 flex items-center gap-1 text-2xl font-bold ${totalReturn >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {totalReturn >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            {formatCurrency(totalReturn, currency)}
          </p>
        </GlassCard>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (investments ?? []).length === 0 ? (
        <EmptyState title="No investments logged" icon={TrendingUp} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(investments ?? []).map((inv) => {
            const gain = inv.currentValue - inv.amount;
            return (
              <GlassCard key={inv.id}>
                <div className="mb-2 flex items-start justify-between">
                  <p className="font-semibold text-[var(--color-text-primary)]">{inv.name}</p>
                  <Badge tone={gain >= 0 ? "success" : "danger"}>
                    {gain >= 0 ? "+" : ""}
                    {formatCurrency(gain, inv.currency)}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)]">Invested {formatCurrency(inv.amount, inv.currency)}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">Now worth {formatCurrency(inv.currentValue, inv.currency)}</p>
                <p className="mt-2 text-xs text-[var(--color-text-secondary)]">Since {formatDate(inv.purchaseDate)}</p>
              </GlassCard>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add investment">
        <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-4" noValidate>
          <Input label="Name" placeholder="Index fund" error={errors.name?.message} {...register("name")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Invested amount" type="number" step="0.01" error={errors.amount?.message} {...register("amount")} />
            <Input label="Current value" type="number" step="0.01" error={errors.currentValue?.message} {...register("currentValue")} />
          </div>
          <Input label="Purchase date" type="date" error={errors.purchaseDate?.message} {...register("purchaseDate")} />
          {submitError && <p className="text-sm font-medium text-red-500">{submitError}</p>}
          <Button type="submit" fullWidth loading={isSubmitting}>
            Save investment
          </Button>
        </form>
      </Modal>
    </div>
  );
}

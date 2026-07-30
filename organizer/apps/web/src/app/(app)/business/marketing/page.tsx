"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Megaphone } from "lucide-react";
import type { MarketingPlanItem } from "@organizer/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useFetch } from "@/lib/hooks";
import { apiPatch, apiPost, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(2, "Give it a title"),
  channel: z.string().min(1, "Add a channel"),
  scheduledDate: z.string().min(1, "Pick a date"),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const STATUS_TONE: Record<MarketingPlanItem["status"], BadgeTone> = {
  planned: "neutral",
  in_progress: "warning",
  done: "success",
};

export default function MarketingPage() {
  const { data: marketingRes, loading, error, refetch } = useFetch<{ marketingItems: MarketingPlanItem[] }>(
    "/api/business/marketing"
  );
  const items = marketingRes?.marketingItems;
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
      await apiPost<MarketingPlanItem>("/api/business/marketing", { ...values, status: "planned" });
      reset();
      setModalOpen(false);
      refetch();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not add marketing item.");
    }
  };

  const cycleStatus = async (item: MarketingPlanItem) => {
    const next = item.status === "planned" ? "in_progress" : item.status === "in_progress" ? "done" : "planned";
    setBusyId(item.id);
    try {
      await apiPatch<MarketingPlanItem>(`/api/business/marketing/${item.id}`, { status: next });
      refetch();
    } finally {
      setBusyId(null);
    }
  };

  const sorted = (items ?? []).slice().sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  return (
    <div>
      <PageHeader
        title="Marketing Plan"
        subtitle="Plan campaigns across channels and track progress."
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add item
          </Button>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : sorted.length === 0 ? (
        <EmptyState title="No marketing items yet" icon={Megaphone} />
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((item) => (
            <GlassCard key={item.id} className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-[var(--color-text-primary)]">{item.title}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {item.channel} · {formatDate(item.scheduledDate)}
                </p>
                {item.notes && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{item.notes}</p>}
              </div>
              <button onClick={() => cycleStatus(item)} disabled={busyId === item.id}>
                <Badge tone={STATUS_TONE[item.status]}>{item.status.replace("_", " ")}</Badge>
              </button>
            </GlassCard>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add marketing item">
        <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-4" noValidate>
          <Input label="Title" placeholder="Launch email campaign" error={errors.title?.message} {...register("title")} />
          <Input label="Channel" placeholder="Email, Instagram, etc." error={errors.channel?.message} {...register("channel")} />
          <Input label="Scheduled date" type="date" error={errors.scheduledDate?.message} {...register("scheduledDate")} />
          <Input label="Notes (optional)" {...register("notes")} />
          {submitError && <p className="text-sm font-medium text-red-500">{submitError}</p>}
          <Button type="submit" fullWidth loading={isSubmitting}>
            Save item
          </Button>
        </form>
      </Modal>
    </div>
  );
}

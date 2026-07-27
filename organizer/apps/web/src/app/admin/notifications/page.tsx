"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Megaphone, Send } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiPost, ApiError } from "@/lib/api";

const schema = z.object({
  title: z.string().min(2, "Give it a title"),
  body: z.string().min(2, "Write a message"),
});
type FormValues = z.infer<typeof schema>;

export default function AdminNotificationsPage() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    setSent(false);
    try {
      await apiPost("/api/admin/notifications/broadcast", values);
      reset();
      setSent(true);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not send broadcast.");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Megaphone className="h-6 w-6 text-[var(--color-accent)]" />
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Broadcast Notification</h1>
      </div>

      <GlassCard className="max-w-lg">
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          Send a push notification and in-app message to every Organizer user.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input label="Title" error={errors.title?.message} {...register("title")} />
          <Input label="Message" error={errors.body?.message} {...register("body")} />
          {submitError && <p className="text-sm font-medium text-red-500">{submitError}</p>}
          {sent && <p className="text-sm font-medium text-emerald-500">Broadcast sent!</p>}
          <Button type="submit" loading={isSubmitting}>
            <Send className="h-4 w-4" /> Send broadcast
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}

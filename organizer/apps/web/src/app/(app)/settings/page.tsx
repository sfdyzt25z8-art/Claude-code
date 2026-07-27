"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BookOpenCheck, Bot, LayoutDashboard, RotateCcw, Save, Sparkles, User } from "lucide-react";
import { SUPPORTED_LANGUAGES, type AppMode, type UserProfile } from "@organizer/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { apiPatch, ApiError } from "@/lib/api";
import { TUTORIAL_STEPS, RESTART_TUTORIAL_EVENT } from "@/components/tutorial/TutorialOverlay";

const schema = z.object({
  name: z.string().min(2, "Enter your name"),
  age: z.coerce.number().min(5).max(120),
  language: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;

const MODES: { value: AppMode; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "business", label: "Business" },
  { value: "personal", label: "Personal" },
];

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const { mode, setMode } = useTheme();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (profile) {
      reset({ name: profile.name, age: profile.age ?? undefined, language: profile.language });
    }
  }, [profile, reset]);

  const onSave = async (values: FormValues) => {
    setSaveError(null);
    setSaved(false);
    try {
      await apiPatch<UserProfile>("/api/profile", values);
      await refreshProfile();
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Could not save changes.");
    }
  };

  const changeMode = async (next: AppMode) => {
    setMode(next);
    try {
      await apiPatch<UserProfile>("/api/profile", { mode: next });
      await refreshProfile();
    } catch {
      // theme preview still applies locally even if persistence fails
    }
  };

  const restartTutorial = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("organizer:tutorial-completed");
      window.dispatchEvent(new Event(RESTART_TUTORIAL_EVENT));
    }
    setTutorialOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" subtitle="Manage your profile, theme, and notifications." />

      <GlassCard>
        <div className="mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-[var(--color-accent)]" />
          <h2 className="font-semibold text-[var(--color-text-primary)]">Profile</h2>
        </div>
        <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-4" noValidate>
          <Input label="Full name" error={errors.name?.message} {...register("name")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Age" type="number" error={errors.age?.message} {...register("age")} />
            <Select
              label="Language"
              options={SUPPORTED_LANGUAGES.map((l) => ({ value: l.code, label: l.label }))}
              {...register("language")}
            />
          </div>
          {saveError && <p className="text-sm font-medium text-red-500">{saveError}</p>}
          {saved && <p className="text-sm font-medium text-emerald-500">Saved!</p>}
          <Button type="submit" loading={isSubmitting} className="self-start">
            <Save className="h-4 w-4" /> Save changes
          </Button>
        </form>
      </GlassCard>

      <GlassCard>
        <div className="mb-4 flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-[var(--color-accent)]" />
          <h2 className="font-semibold text-[var(--color-text-primary)]">Mode &amp; theme</h2>
        </div>
        <p className="mb-3 text-sm text-[var(--color-text-secondary)]">
          Switching modes changes your dashboard, sidebar, and color theme.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => changeMode(m.value)}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                mode === m.value ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]" : ""
              }`}
              style={{ borderColor: mode === m.value ? undefined : "var(--color-border)" }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="mb-4 flex items-center gap-2">
          <Bot className="h-5 w-5 text-[var(--color-accent)]" />
          <h2 className="font-semibold text-[var(--color-text-primary)]">Notifications</h2>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Manage notification preferences from the <span className="font-medium text-[var(--color-text-primary)]">Notifications</span> page.
          Reminders for homework, exams, habits, and goals are sent automatically.
        </p>
      </GlassCard>

      <GlassCard>
        <div className="mb-4 flex items-center gap-2">
          <BookOpenCheck className="h-5 w-5 text-[var(--color-accent)]" />
          <h2 className="font-semibold text-[var(--color-text-primary)]">Tutorial Center</h2>
        </div>
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          Revisit the walkthrough that introduces Organizer&apos;s core features.
        </p>
        <ul className="mb-4 flex flex-col gap-2">
          {TUTORIAL_STEPS.map((step, i) => (
            <li key={step.title} className="flex items-center gap-3 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)" }}>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-xs font-semibold text-[var(--color-accent)]">
                {i + 1}
              </span>
              <span className="text-[var(--color-text-primary)]">{step.title}</span>
            </li>
          ))}
        </ul>
        <Button variant="outline" onClick={restartTutorial}>
          <RotateCcw className="h-4 w-4" /> Restart tutorial
        </Button>
        {tutorialOpen && (
          <p className="mt-2 flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
            <Sparkles className="h-3 w-3" /> Tutorial restarted — look for the overlay.
          </p>
        )}
      </GlassCard>
    </div>
  );
}

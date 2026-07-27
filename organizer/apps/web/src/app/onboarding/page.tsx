"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Briefcase, GraduationCap, HeartPulse, Check } from "lucide-react";
import {
  PERSONAL_FOCUS_OPTIONS,
  SUPPORTED_LANGUAGES,
  currencyForCountry,
  type AppMode,
  type OnboardingInput,
  type PersonalFocus,
} from "@organizer/shared";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { apiPost, ApiError } from "@/lib/api";
import { COUNTRIES } from "@/lib/countries";
import { titleCase } from "@/lib/utils";

const MODES: { mode: AppMode; icon: typeof GraduationCap; title: string; desc: string }[] = [
  { mode: "student", icon: GraduationCap, title: "Student", desc: "Homework, grades, quizzes & study planning." },
  { mode: "business", icon: Briefcase, title: "Business", desc: "Revenue, budgets, goals & growth academies." },
  { mode: "personal", icon: HeartPulse, title: "Personal", desc: "Habits, wellness & personal goals." },
];

type Step = "name" | "age" | "locale" | "mode" | "extra" | "review";

export default function OnboardingPage() {
  const router = useRouter();
  const { firebaseUser, profile, loading, refreshProfile } = useAuth();
  const { setMode } = useTheme();

  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [countryCode, setCountryCode] = useState("US");
  const [language, setLanguage] = useState("en");
  const [mode, setModeValue] = useState<AppMode | null>(null);
  const [ownsBusiness, setOwnsBusiness] = useState<boolean | null>(null);
  const [personalFocus, setPersonalFocus] = useState<PersonalFocus[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !firebaseUser) router.replace("/login");
    if (!loading && profile?.onboardingCompleted) router.replace("/dashboard");
  }, [loading, firebaseUser, profile, router]);

  useEffect(() => {
    if (profile?.name) setName(profile.name);
  }, [profile]);

  const steps = useMemo<Step[]>(() => {
    const base: Step[] = ["name", "age", "locale", "mode"];
    if (mode === "business" || mode === "personal") base.push("extra");
    base.push("review");
    return base;
  }, [mode]);

  const stepIndex = steps.indexOf(step);
  const progressPct = Math.round(((stepIndex + 1) / steps.length) * 100);

  const goNext = () => {
    setError(null);
    const idx = steps.indexOf(step);
    if (step === "name" && name.trim().length < 2) return setError("Please enter your name.");
    if (step === "age" && (!age || Number(age) < 5 || Number(age) > 120)) return setError("Please enter a valid age.");
    if (step === "mode" && !mode) return setError("Please choose a mode to continue.");
    if (step === "extra" && mode === "business" && ownsBusiness === null) return setError("Please answer the question.");
    if (idx < steps.length - 1) setStep(steps[idx + 1]!);
  };

  const goBack = () => {
    setError(null);
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]!);
  };

  const handleModeSelect = (m: AppMode) => {
    setModeValue(m);
    setMode(m); // live preview of the chosen theme
  };

  const toggleFocus = (focus: PersonalFocus) => {
    setPersonalFocus((prev) => (prev.includes(focus) ? prev.filter((f) => f !== focus) : [...prev, focus]));
  };

  const handleFinish = async () => {
    if (!mode) return;
    setSubmitting(true);
    setError(null);
    try {
      const country = COUNTRIES.find((c) => c.code === countryCode)?.name ?? countryCode;
      const payload: OnboardingInput = {
        name: name.trim(),
        age: Number(age),
        country,
        countryCode,
        language,
        mode,
        ...(mode === "business" ? { ownsBusiness: ownsBusiness ?? false } : {}),
        ...(mode === "personal" ? { personalFocus } : {}),
      };
      await apiPost("/api/onboarding", payload);
      await refreshProfile();
      setMode(mode);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
            <span>Setting up your Organizer</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
            <motion.div
              className="h-full rounded-full bg-[var(--color-accent)]"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        <GlassCard className="p-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
            >
              {step === "name" && (
                <div className="flex flex-col gap-4">
                  <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">What&apos;s your name?</h1>
                  <Input
                    label="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jordan Rivers"
                    autoFocus
                  />
                </div>
              )}

              {step === "age" && (
                <div className="flex flex-col gap-4">
                  <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">How old are you?</h1>
                  <Input
                    label="Age"
                    type="number"
                    min={5}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="21"
                    autoFocus
                  />
                </div>
              )}

              {step === "locale" && (
                <div className="flex flex-col gap-4">
                  <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Where are you based?</h1>
                  <Select
                    label="Country"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
                  />
                  <Select
                    label="Preferred language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    options={SUPPORTED_LANGUAGES.map((l) => ({ value: l.code, label: l.label }))}
                  />
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Currency will default to {currencyForCountry(countryCode)}.
                  </p>
                </div>
              )}

              {step === "mode" && (
                <div className="flex flex-col gap-4">
                  <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">How do you want to use Organizer?</h1>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {MODES.map(({ mode: m, icon: Icon, title, desc }) => {
                      const selected = mode === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleModeSelect(m)}
                          className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition ${
                            selected ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]" : ""
                          }`}
                          style={{ borderColor: selected ? undefined : "var(--color-border)" }}
                        >
                          <Icon className="h-6 w-6 text-[var(--color-accent)]" />
                          <span className="font-semibold text-[var(--color-text-primary)]">{title}</span>
                          <span className="text-xs text-[var(--color-text-secondary)]">{desc}</span>
                          {selected && <Check className="h-4 w-4 text-[var(--color-accent)]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === "extra" && mode === "business" && (
                <div className="flex flex-col gap-4">
                  <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Do you own a business?</h1>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: true, label: "Yes, I own one" },
                      { value: false, label: "No, I'm an employee" },
                    ].map((opt) => (
                      <button
                        key={String(opt.value)}
                        type="button"
                        onClick={() => setOwnsBusiness(opt.value)}
                        className={`rounded-2xl border p-4 text-sm font-medium transition ${
                          ownsBusiness === opt.value ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]" : ""
                        }`}
                        style={{ borderColor: ownsBusiness === opt.value ? undefined : "var(--color-border)" }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === "extra" && mode === "personal" && (
                <div className="flex flex-col gap-4">
                  <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">What do you want to focus on?</h1>
                  <p className="text-xs text-[var(--color-text-secondary)]">Choose as many as apply.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PERSONAL_FOCUS_OPTIONS.map((focus) => {
                      const selected = personalFocus.includes(focus);
                      return (
                        <button
                          key={focus}
                          type="button"
                          onClick={() => toggleFocus(focus)}
                          className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${
                            selected ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]" : ""
                          }`}
                          style={{ borderColor: selected ? undefined : "var(--color-border)" }}
                        >
                          {titleCase(focus)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === "review" && (
                <div className="flex flex-col gap-3">
                  <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">You&apos;re all set, {name.split(" ")[0]}</h1>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    We&apos;ll set you up in <strong>{mode ? titleCase(mode) : "—"}</strong> mode. You can change this anytime in Settings.
                  </p>
                  <dl className="mt-2 grid grid-cols-2 gap-y-2 rounded-xl bg-[var(--color-surface-glass)] p-4 text-sm">
                    <dt className="text-[var(--color-text-secondary)]">Age</dt>
                    <dd className="text-right text-[var(--color-text-primary)]">{age}</dd>
                    <dt className="text-[var(--color-text-secondary)]">Country</dt>
                    <dd className="text-right text-[var(--color-text-primary)]">
                      {COUNTRIES.find((c) => c.code === countryCode)?.name}
                    </dd>
                    <dt className="text-[var(--color-text-secondary)]">Language</dt>
                    <dd className="text-right text-[var(--color-text-primary)]">
                      {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label}
                    </dd>
                    {mode === "business" && (
                      <>
                        <dt className="text-[var(--color-text-secondary)]">Role</dt>
                        <dd className="text-right text-[var(--color-text-primary)]">{ownsBusiness ? "Owner" : "Employee"}</dd>
                      </>
                    )}
                    {mode === "personal" && personalFocus.length > 0 && (
                      <>
                        <dt className="text-[var(--color-text-secondary)]">Focus</dt>
                        <dd className="text-right text-[var(--color-text-primary)]">
                          {personalFocus.map(titleCase).join(", ")}
                        </dd>
                      </>
                    )}
                  </dl>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {error && <p className="mt-4 text-sm font-medium text-red-500">{error}</p>}

          <div className="mt-7 flex items-center justify-between">
            <Button variant="ghost" onClick={goBack} disabled={stepIndex === 0}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step === "review" ? (
              <Button onClick={handleFinish} loading={submitting}>
                Enter Organizer <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={goNext}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </GlassCard>
      </div>
    </main>
  );
}

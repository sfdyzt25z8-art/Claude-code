"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { apiPatch } from "@/lib/api";
import type { UserProfile } from "@organizer/shared";

const LOCAL_KEY = "organizer:tutorial-completed";
export const RESTART_TUTORIAL_EVENT = "organizer:restart-tutorial";

export const TUTORIAL_STEPS = [
  {
    title: "Welcome to Organizer",
    body: "This is your AI-powered life operating system. Your sidebar adapts to your chosen mode — Student, Business, or Personal.",
  },
  {
    title: "Your dashboard",
    body: "The dashboard shows the widgets that matter most right now: what's due, your streaks, and quick actions.",
  },
  {
    title: "Talk to the AI Assistant",
    body: "Open 'AI Assistant' any time for personalized help, suggestions, and quick answers grounded in your data.",
  },
  {
    title: "You're ready",
    body: "Explore the sidebar for the full feature set. You can restart this tutorial anytime from Settings > Tutorial Center.",
  },
];

export function TutorialOverlay() {
  const { profile, refreshProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!profile) return;
    const localDone = typeof window !== "undefined" && window.localStorage.getItem(LOCAL_KEY) === "true";
    if (!profile.tutorialCompleted && !localDone) {
      setOpen(true);
    }
  }, [profile]);

  useEffect(() => {
    const handler = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(RESTART_TUTORIAL_EVENT, handler);
    return () => window.removeEventListener(RESTART_TUTORIAL_EVENT, handler);
  }, []);

  const complete = async () => {
    setOpen(false);
    if (typeof window !== "undefined") window.localStorage.setItem(LOCAL_KEY, "true");
    try {
      await apiPatch<UserProfile>("/api/profile", { tutorialCompleted: true });
      await refreshProfile();
    } catch {
      // Backend may be unavailable; localStorage flag still prevents re-showing.
    }
  };

  if (!open) return null;

  const current = TUTORIAL_STEPS[step]!;
  const isLast = step === TUTORIAL_STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="glass w-full max-w-md rounded-2xl border p-6 shadow-glass-lg"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
          role="dialog"
          aria-modal="true"
          aria-label="Product tutorial"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--color-accent)]" />
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                Step {step + 1} of {TUTORIAL_STEPS.length}
              </span>
            </div>
            <button aria-label="Skip tutorial" onClick={complete} className="rounded-full p-1 hover:bg-[var(--color-surface-glass)]">
              <X className="h-4 w-4 text-[var(--color-text-secondary)]" />
            </button>
          </div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{current.title}</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{current.body}</p>

          <div className="mt-5 flex gap-1.5">
            {TUTORIAL_STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full"
                style={{ background: i <= step ? "var(--color-accent)" : "var(--color-border)" }}
              />
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <Button variant="ghost" onClick={complete}>
              Skip
            </Button>
            <Button onClick={() => (isLast ? complete() : setStep((s) => s + 1))}>
              {isLast ? "Finish" : "Next"} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, GraduationCap, Briefcase, HeartPulse } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function HomePage() {
  const { firebaseUser, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (firebaseUser) {
      router.replace(profile?.onboardingCompleted ? "/dashboard" : "/onboarding");
    }
  }, [loading, firebaseUser, profile, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingSpinner label="Loading Organizer" />
      </main>
    );
  }

  if (firebaseUser) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingSpinner label="Taking you in" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl text-center"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--color-accent)]/20">
          <Sparkles className="h-8 w-8 text-[var(--color-accent)]" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-5xl">
          Organizer
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--color-text-secondary)]">
          The AI-powered life operating system for students, business builders, and anyone
          leveling up their personal life — one plan, one dashboard, one you.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/signup">
            <Button size="lg">Get started free</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              I already have an account
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: GraduationCap, title: "Student", desc: "Homework, grades, quizzes, study planning." },
            { icon: Briefcase, title: "Business", desc: "Revenue, budgets, goals, growth academies." },
            { icon: HeartPulse, title: "Personal", desc: "Habits, goals, wellness — your calm OS." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass rounded-2xl border p-5 text-left shadow-glass" style={{ borderColor: "var(--color-border)" }}>
              <Icon className="mb-2 h-6 w-6 text-[var(--color-accent)]" />
              <p className="font-semibold text-[var(--color-text-primary)]">{title}</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </main>
  );
}

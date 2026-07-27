"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, GraduationCap, ListChecks, XCircle } from "lucide-react";
import type { Quiz, QuizAttempt, QuizRecommendation } from "@organizer/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { apiPost, ApiError } from "@/lib/api";
import { titleCase, cn } from "@/lib/utils";

interface SubmitResponse {
  attempt: QuizAttempt;
  recommendations: QuizRecommendation;
}

export default function QuizPage() {
  const params = useParams<{ subject: string }>();
  const router = useRouter();
  const subject = params.subject;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiPost<Quiz>("/api/student/quizzes", { subject })
      .then((q) => {
        if (cancelled) return;
        setQuiz(q);
        setAnswers(new Array(q.questions.length).fill(-1));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : "Could not load quiz.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [subject]);

  if (loading) {
    return (
      <div>
        <PageHeader title={`${titleCase(subject)} quiz`} />
        <LoadingSpinner label="Generating your quiz" />
      </div>
    );
  }

  if (loadError || !quiz) {
    return (
      <div>
        <PageHeader title={`${titleCase(subject)} quiz`} />
        <GlassCard>
          <p className="text-sm text-red-500">{loadError ?? "Quiz unavailable."}</p>
          <Button className="mt-4" variant="outline" onClick={() => router.push("/student/quizzes")}>
            <ArrowLeft className="h-4 w-4" /> Back to subjects
          </Button>
        </GlassCard>
      </div>
    );
  }

  if (result) {
    const pct = Math.round((result.attempt.score / result.attempt.totalQuestions) * 100);
    return (
      <div>
        <PageHeader title={`${titleCase(subject)} quiz results`} />
        <GlassCard className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent)]/20">
            <GraduationCap className="h-8 w-8 text-[var(--color-accent)]" />
          </div>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">
            {result.attempt.score}/{result.attempt.totalQuestions}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">{pct}% correct</p>
          <div className="mx-auto mt-4 max-w-xs">
            <ProgressBar value={pct} />
          </div>
        </GlassCard>

        <div className="mb-6 flex flex-col gap-3">
          {quiz.questions.map((q, i) => {
            const correct = answers[i] === q.correctIndex;
            return (
              <GlassCard key={q.id} className="flex items-start gap-3">
                {correct ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                )}
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">{q.prompt}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    Correct answer: {q.choices[q.correctIndex]}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{q.explanation}</p>
                </div>
              </GlassCard>
            );
          })}
        </div>

        <GlassCard>
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-[var(--color-text-primary)]">
            <BookOpen className="h-5 w-5 text-[var(--color-accent)]" /> Recommendations for you
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(
              [
                ["Books", result.recommendations.books],
                ["Courses", result.recommendations.courses],
                ["Study plans", result.recommendations.studyPlans],
                ["Practice exercises", result.recommendations.practiceExercises],
              ] as const
            ).map(([label, list]) => (
              <div key={label}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">{label}</p>
                {list.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-secondary)]">None suggested.</p>
                ) : (
                  <ul className="list-inside list-disc text-sm text-[var(--color-text-primary)]">
                    {list.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => router.push("/student/quizzes")}>
            <ArrowLeft className="h-4 w-4" /> Choose another subject
          </Button>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentIndex]!;
  const selected = answers[currentIndex] ?? -1;
  const allAnswered = answers.every((a) => a !== -1);

  const selectAnswer = (choiceIdx: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = choiceIdx;
      return next;
    });
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    try {
      const res = await apiPost<SubmitResponse>(`/api/student/quizzes/${quiz.id}/submit`, { answers });
      setResult(res);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Could not submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={`${titleCase(subject)} quiz`}
        subtitle={`Question ${currentIndex + 1} of ${quiz.questions.length}`}
      />
      <div className="mb-4">
        <ProgressBar value={currentIndex + 1} max={quiz.questions.length} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
        >
          <GlassCard>
            <div className="mb-4 flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-[var(--color-accent)]" />
              <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                {question.difficulty}
              </span>
            </div>
            <p className="mb-5 text-lg font-medium text-[var(--color-text-primary)]">{question.prompt}</p>
            <div className="flex flex-col gap-2">
              {question.choices.map((choice, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectAnswer(idx)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left text-sm font-medium transition",
                    selected === idx ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]" : ""
                  )}
                  style={{ borderColor: selected === idx ? undefined : "var(--color-border)" }}
                >
                  {choice}
                </button>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0}>
          <ArrowLeft className="h-4 w-4" /> Previous
        </Button>
        {currentIndex < quiz.questions.length - 1 ? (
          <Button onClick={() => setCurrentIndex((i) => Math.min(quiz.questions.length - 1, i + 1))} disabled={selected === -1}>
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={submitQuiz} loading={submitting} disabled={!allAnswered}>
            Submit quiz
          </Button>
        )}
      </div>
    </div>
  );
}

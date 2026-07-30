"use client";

import Link from "next/link";
import { BookOpen, CalendarClock, ClipboardCheck, Flame, GraduationCap, ListChecks, Star } from "lucide-react";
import type { Exam, Homework, ReadingEntry, StudyPlanItem } from "@organizer/shared";
import { SUBJECTS, levelForXp, xpForLevel } from "@organizer/shared";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useFetch } from "@/lib/hooks";
import { daysUntil, formatDate, titleCase } from "@/lib/utils";

interface GamificationLike {
  xp?: number;
  level?: number;
  currentStreak?: number;
  coins?: number;
}

export function StudentDashboard() {
  const { data: homeworkRes, loading: hwLoading } = useFetch<{ homework: Homework[] }>("/api/student/homework");
  const homework = homeworkRes?.homework;
  const { data: examsRes, loading: examsLoading } = useFetch<{ exams: Exam[] }>("/api/student/exams/countdown");
  const exams = examsRes?.exams;
  const { data: planRes, loading: planLoading } = useFetch<{ studyPlanItems: StudyPlanItem[] }>(
    "/api/student/study-plan"
  );
  const plan = planRes?.studyPlanItems;
  const { data: readingRes, loading: readingLoading } = useFetch<{ reading: ReadingEntry[] }>("/api/student/reading");
  const reading = readingRes?.reading;
  const { data: gamificationRes } = useFetch<{ gamification: GamificationLike }>("/api/statistics/gamification");
  const gamification = gamificationRes?.gamification;

  const upcomingHomework = (homework ?? [])
    .filter((h) => !h.completed)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  const upcomingExams = (exams ?? [])
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const today = new Date().toDateString();
  const todaysPlan = (plan ?? [])
    .filter((p) => new Date(p.scheduledAt).toDateString() === today)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const activeReading = (reading ?? []).filter((r) => r.status === "reading").slice(0, 3);

  const xp = gamification?.xp ?? 0;
  const level = gamification?.level ?? levelForXp(xp);
  const streak = gamification?.currentStreak ?? 0;
  const nextLevelXp = xpForLevel(level + 1);
  const currentLevelXp = xpForLevel(level);
  const levelProgress = Math.max(0, Math.min(100, ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100));

  return (
    <div className="flex flex-col gap-6">
      <GlassCard className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-[var(--color-text-secondary)]">Your student journey</p>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-2xl font-bold text-[var(--color-text-primary)]">Level {level}</span>
            <Badge tone="accent">{xp} XP</Badge>
            <Badge tone="warning">
              <Flame className="h-3 w-3" /> {streak} day streak
            </Badge>
          </div>
          <div className="mt-3 w-56">
            <ProgressBar value={levelProgress} label={`Next level in ${Math.max(0, nextLevelXp - xp)} XP`} />
          </div>
        </div>
        <Link href="/student/quizzes" className="shrink-0">
          <div className="flex items-center gap-2 rounded-2xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-black">
            <ListChecks className="h-4 w-4" /> Start a quiz
          </div>
        </Link>
      </GlassCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard>
          <div className="mb-3 flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-[var(--color-accent)]" />
            <h2 className="font-semibold text-[var(--color-text-primary)]">Homework due soon</h2>
          </div>
          {hwLoading ? (
            <LoadingSpinner />
          ) : upcomingHomework.length === 0 ? (
            <EmptyState title="Nothing due" description="You're all caught up on homework." icon={ClipboardCheck} />
          ) : (
            <ul className="flex flex-col gap-3">
              {upcomingHomework.map((h) => {
                const days = daysUntil(h.dueDate);
                return (
                  <li key={h.id} className="flex items-center justify-between gap-2 text-sm">
                    <div>
                      <p className="font-medium text-[var(--color-text-primary)]">{h.title}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{titleCase(h.subject)}</p>
                    </div>
                    <Badge tone={days !== null && days <= 1 ? "danger" : "neutral"}>
                      {days === null ? formatDate(h.dueDate) : days <= 0 ? "Due today" : `${days}d`}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/student/homework" className="mt-4 inline-block text-xs font-medium text-[var(--color-accent)] hover:underline">
            View all homework →
          </Link>
        </GlassCard>

        <GlassCard>
          <div className="mb-3 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-[var(--color-accent)]" />
            <h2 className="font-semibold text-[var(--color-text-primary)]">Exam countdown</h2>
          </div>
          {examsLoading ? (
            <LoadingSpinner />
          ) : upcomingExams.length === 0 ? (
            <EmptyState title="No exams scheduled" icon={GraduationCap} />
          ) : (
            <ul className="flex flex-col gap-3">
              {upcomingExams.map((exam) => {
                const days = daysUntil(exam.date);
                return (
                  <li key={exam.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-[var(--color-text-primary)]">{exam.title}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{titleCase(exam.subject)}</p>
                    </div>
                    <Badge tone={days !== null && days <= 3 ? "danger" : "accent"}>
                      {days === null ? formatDate(exam.date) : `${days}d`}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/student/exams" className="mt-4 inline-block text-xs font-medium text-[var(--color-accent)] hover:underline">
            View all exams →
          </Link>
        </GlassCard>

        <GlassCard>
          <div className="mb-3 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-[var(--color-accent)]" />
            <h2 className="font-semibold text-[var(--color-text-primary)]">Today&apos;s study plan</h2>
          </div>
          {planLoading ? (
            <LoadingSpinner />
          ) : todaysPlan.length === 0 ? (
            <EmptyState title="No sessions planned today" icon={CalendarClock} />
          ) : (
            <ul className="flex flex-col gap-3">
              {todaysPlan.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">{item.title}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {titleCase(item.subject)} · {item.durationMinutes}min
                    </p>
                  </div>
                  {item.completed && <Badge tone="success">Done</Badge>}
                </li>
              ))}
            </ul>
          )}
          <Link href="/student/planner" className="mt-4 inline-block text-xs font-medium text-[var(--color-accent)] hover:underline">
            Open planner →
          </Link>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard>
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[var(--color-accent)]" />
            <h2 className="font-semibold text-[var(--color-text-primary)]">Reading progress</h2>
          </div>
          {readingLoading ? (
            <LoadingSpinner />
          ) : activeReading.length === 0 ? (
            <EmptyState title="No books in progress" icon={BookOpen} />
          ) : (
            <ul className="flex flex-col gap-4">
              {activeReading.map((r) => (
                <li key={r.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-[var(--color-text-primary)]">{r.title}</span>
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {r.pagesRead}/{r.totalPages ?? "?"} pages
                    </span>
                  </div>
                  <ProgressBar value={r.pagesRead} max={r.totalPages ?? (r.pagesRead || 1)} />
                </li>
              ))}
            </ul>
          )}
          <Link href="/student/reading" className="mt-4 inline-block text-xs font-medium text-[var(--color-accent)] hover:underline">
            Open reading log →
          </Link>
        </GlassCard>

        <GlassCard>
          <div className="mb-3 flex items-center gap-2">
            <Star className="h-5 w-5 text-[var(--color-accent)]" />
            <h2 className="font-semibold text-[var(--color-text-primary)]">Quick quiz start</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SUBJECTS.slice(0, 8).map((subject) => (
              <Link
                key={subject}
                href={`/student/quizzes/${subject}`}
                className="rounded-xl border px-3 py-3 text-center text-xs font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-glass)]"
                style={{ borderColor: "var(--color-border)" }}
              >
                {titleCase(subject)}
              </Link>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { SUBJECTS } from "@organizer/shared";
import {
  Calculator,
  FlaskConical,
  BookText,
  Globe2,
  Landmark,
  Cpu,
  Briefcase,
  LineChart,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { titleCase } from "@/lib/utils";

const SUBJECT_ICONS: Record<string, typeof Calculator> = {
  math: Calculator,
  science: FlaskConical,
  english: BookText,
  geography: Globe2,
  history: Landmark,
  computer_science: Cpu,
  business: Briefcase,
  economics: LineChart,
};

export default function QuizzesPage() {
  return (
    <div>
      <PageHeader title="Quizzes" subtitle="Pick a subject to start a 15-question quiz tailored to you." />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {SUBJECTS.map((subject) => {
          const Icon = SUBJECT_ICONS[subject] ?? Calculator;
          return (
            <Link key={subject} href={`/student/quizzes/${subject}`}>
              <GlassCard hoverable className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="rounded-2xl bg-[var(--color-accent)]/20 p-3">
                  <Icon className="h-7 w-7 text-[var(--color-accent)]" />
                </div>
                <p className="font-semibold text-[var(--color-text-primary)]">{titleCase(subject)}</p>
              </GlassCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

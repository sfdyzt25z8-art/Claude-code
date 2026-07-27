"use client";

import Link from "next/link";
import { ACADEMIES } from "@organizer/shared";
import { Megaphone, Palette, Handshake, Crown, LineChart, Code2, Bot } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { titleCase } from "@/lib/utils";

const ACADEMY_ICONS: Record<string, typeof Megaphone> = {
  marketing: Megaphone,
  branding: Palette,
  sales: Handshake,
  leadership: Crown,
  investing: LineChart,
  app_development_replit: Code2,
  ai_app_development: Bot,
};

export default function AcademiesPage() {
  return (
    <div>
      <PageHeader title="Growth Academies" subtitle="Structured learning paths to grow your business skills." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACADEMIES.map((key) => {
          const Icon = ACADEMY_ICONS[key] ?? Megaphone;
          return (
            <Link key={key} href={`/business/academies/${key}`}>
              <GlassCard hoverable className="flex flex-col items-start gap-3 py-6">
                <div className="rounded-2xl bg-[var(--color-accent)]/20 p-3">
                  <Icon className="h-6 w-6 text-[var(--color-accent)]" />
                </div>
                <p className="font-semibold text-[var(--color-text-primary)]">{titleCase(key)}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">Explore modules and track your completion.</p>
              </GlassCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

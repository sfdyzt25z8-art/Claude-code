import Link from "next/link";
import { Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="animate-fade-in">
      <Link href="/" className="mb-6 flex items-center justify-center gap-2">
        <div className="rounded-xl bg-[var(--color-accent)]/20 p-1.5">
          <Sparkles className="h-5 w-5 text-[var(--color-accent)]" />
        </div>
        <span className="font-semibold text-[var(--color-text-primary)]">Organizer</span>
      </Link>
      <GlassCard className="p-7">
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </GlassCard>
      {footer && <div className="mt-4 text-center text-sm text-[var(--color-text-secondary)]">{footer}</div>}
    </div>
  );
}

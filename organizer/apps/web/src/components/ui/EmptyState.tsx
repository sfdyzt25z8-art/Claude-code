import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-12 text-center">
      <div className="rounded-full bg-[var(--color-surface-glass)] p-3">
        <Icon className="h-6 w-6 text-[var(--color-text-secondary)]" aria-hidden />
      </div>
      <div>
        <p className="font-medium text-[var(--color-text-primary)]">{title}</p>
        {description && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

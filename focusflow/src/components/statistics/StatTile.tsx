import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
}

const toneClasses: Record<NonNullable<StatTileProps['tone']>, string> = {
  primary: 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]',
  success: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  warning: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
  danger: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
};

export function StatTile({ icon: Icon, label, value, tone = 'primary' }: StatTileProps) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-semibold text-[var(--color-text)]">{value}</p>
        <p className="truncate text-xs text-[var(--color-text-muted)]">{label}</p>
      </div>
    </Card>
  );
}

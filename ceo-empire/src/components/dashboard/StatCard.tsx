import { type ReactNode } from 'react';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: 'gold' | 'emerald' | 'red' | 'navy' | 'white';
}

const ACCENT_CLASSES: Record<NonNullable<StatCardProps['accent']>, string> = {
  gold: 'text-gold-400 bg-gold-500/10',
  emerald: 'text-emerald-400 bg-emerald-500/10',
  red: 'text-red-400 bg-red-500/10',
  navy: 'text-navy-300 bg-navy-600/20',
  white: 'text-white bg-white/10',
};

export function StatCard({ icon, label, value, sub, accent = 'white' }: StatCardProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-white/40">{label}</p>
          <p className="mt-1.5 text-xl font-bold text-white sm:text-2xl">{value}</p>
          {sub && <p className="mt-1 text-xs text-white/40">{sub}</p>}
        </div>
        <div className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', ACCENT_CLASSES[accent])}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

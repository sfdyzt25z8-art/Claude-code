import clsx from 'clsx';

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  barClassName?: string;
  label?: string;
}

export function ProgressBar({ value, max, className, barClassName, label }: ProgressBarProps) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      {label && <span className="text-xs text-white/50">{label}</span>}
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={clsx(
            'h-full rounded-full bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 transition-all duration-500',
            barClassName,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  className?: string;
  trackClassName?: string;
  height?: number;
}

export function ProgressBar({ value, color, className = '', trackClassName = '', height = 8 }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)] ${trackClassName}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${className}`}
        style={{ width: `${clamped}%`, backgroundColor: color ?? 'var(--color-primary)' }}
      />
    </div>
  );
}

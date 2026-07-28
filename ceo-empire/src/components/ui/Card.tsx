import { type HTMLAttributes } from 'react';
import clsx from 'clsx';

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-white/[0.06] bg-ink-800/60 backdrop-blur-sm card-glow',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

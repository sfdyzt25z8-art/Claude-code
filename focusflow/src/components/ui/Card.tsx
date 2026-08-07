import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  hoverable?: boolean;
}

export function Card({ children, className = '', hoverable = false, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm shadow-black/[0.02] ${
        hoverable ? 'transition-shadow hover:shadow-md hover:shadow-black/[0.04]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

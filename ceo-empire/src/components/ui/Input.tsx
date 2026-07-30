import { type InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, id, ...rest },
  ref,
) {
  return (
    <label className="flex flex-col gap-1.5 text-left" htmlFor={id}>
      {label && <span className="text-xs font-medium text-white/60">{label}</span>}
      <input
        ref={ref}
        id={id}
        className={clsx(
          'w-full rounded-xl border bg-ink-900/70 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors',
          'focus:border-gold-500/60 focus:ring-2 focus:ring-gold-500/20',
          error ? 'border-red-500/50' : 'border-white/10',
          className,
        )}
        {...rest}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </label>
  );
});

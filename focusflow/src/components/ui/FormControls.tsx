import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

const fieldBase =
  'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3.5 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] transition-colors focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20';

export function Field({
  label,
  children,
  error,
  htmlFor,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  htmlFor?: string;
} & LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-[var(--color-text)]">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props;
  return <input className={`${fieldBase} ${className}`} {...rest} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', ...rest } = props;
  return <textarea className={`${fieldBase} resize-none ${className}`} {...rest} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', ...rest } = props;
  return (
    <select className={`${fieldBase} ${className}`} {...rest}>
      {props.children}
    </select>
  );
}

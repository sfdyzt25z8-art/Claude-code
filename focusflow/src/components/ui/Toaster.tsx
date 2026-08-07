import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToastStore } from '@/store/useToastStore';
import type { ToastVariant } from '@/store/useToastStore';

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-[var(--color-success)]/30 text-[var(--color-success)]',
  error: 'border-[var(--color-danger)]/30 text-[var(--color-danger)]',
  info: 'border-[var(--color-primary)]/30 text-[var(--color-primary)]',
};

const variantIcon: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:top-6">
      {toasts.map((t) => {
        const Icon = variantIcon[t.variant];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-xl border bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] shadow-lg animate-toast-in ${variantStyles[t.variant]}`}
            role="status"
          >
            <Icon size={18} className="mt-0.5 shrink-0" />
            <p className="flex-1">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="shrink-0 text-[var(--color-text-subtle)] hover:text-[var(--color-text)]"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

import { create } from 'zustand';
import { createId } from '@/lib/id';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastState {
  toasts: ToastItem[];
  show: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: string) => void;
}

const AUTO_DISMISS_MS = 3200;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (message, variant = 'info') => {
    const id = createId();
    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }));
    window.setTimeout(() => get().dismiss(id), AUTO_DISMISS_MS);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export function toast(message: string, variant?: ToastVariant): void {
  useToastStore.getState().show(message, variant);
}

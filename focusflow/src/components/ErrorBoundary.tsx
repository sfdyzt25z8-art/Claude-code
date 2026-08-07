import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[FocusFlow] Unhandled UI error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-bg)] px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
            <AlertTriangle size={26} />
          </div>
          <div>
            <p className="text-lg font-semibold text-[var(--color-text)]">Something went wrong</p>
            <p className="mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">
              FocusFlow hit an unexpected error. Your data is safe in local storage — reloading usually fixes it.
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>Reload FocusFlow</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Label shown in the fallback so nested boundaries can identify what broke. */
  label?: string;
  /** Called when the user chooses to reset — e.g. clear the boundary and re-render children. */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ''}]`, error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
          <p className="mt-1 max-w-sm text-sm text-white/50">
            {this.props.label ? `The ${this.props.label} hit an unexpected error.` : 'An unexpected error occurred.'}{' '}
            Your progress is saved, so a reload won't lose anything.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={<RotateCcw className="h-4 w-4" />} onClick={this.handleReset}>
            Try Again
          </Button>
          <Button icon={<Home className="h-4 w-4" />} onClick={() => window.location.reload()}>
            Reload App
          </Button>
        </div>
      </div>
    );
  }
}

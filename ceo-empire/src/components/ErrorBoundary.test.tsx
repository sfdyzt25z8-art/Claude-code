// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('boom');
  return <div>All good</div>;
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // React (and our own componentDidCatch) logs the caught error to console;
    // silence it so intentional test errors don't clutter output.
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('shows a fallback UI instead of crashing when a child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByText('All good')).not.toBeInTheDocument();
  });

  it('includes the label in the fallback message when provided', () => {
    render(
      <ErrorBoundary label="Businesses page">
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/Businesses page hit an unexpected error/i)).toBeInTheDocument();
  });

  it('lets the user retry, re-rendering children if the error condition clears', () => {
    function Harness() {
      const [broken, setBroken] = useState(true);
      return (
        <ErrorBoundary onReset={() => setBroken(false)}>
          <Bomb shouldThrow={broken} />
        </ErrorBoundary>
      );
    }
    render(<Harness />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByText('All good')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('logs the caught error for debugging', () => {
    render(
      <ErrorBoundary label="test">
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );
    const loggedOurError = consoleErrorSpy.mock.calls.some((call: unknown[]) =>
      call.some((arg) => arg instanceof Error && arg.message === 'boom'),
    );
    expect(loggedOurError).toBe(true);
  });
});

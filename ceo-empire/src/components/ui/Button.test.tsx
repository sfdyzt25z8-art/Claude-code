// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Button } from './Button';

describe('Button', () => {
  it('renders its children as label text', () => {
    render(<Button>Buy for $500</Button>);
    expect(screen.getByRole('button', { name: 'Buy for $500' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Disabled
      </Button>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is disabled while loading, even without an explicit disabled prop', () => {
    render(<Button loading>Saving</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows a spinner instead of the icon while loading', () => {
    const { container, rerender } = render(
      <Button icon={<svg data-testid="icon" />}>Go</Button>,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();

    rerender(
      <Button icon={<svg data-testid="icon" />} loading>
        Go
      </Button>,
    );
    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('has no accessibility violations in its default or disabled states', async () => {
    const { container } = render(
      <>
        <Button>Buy for $500</Button>
        <Button disabled>Not enough cash</Button>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

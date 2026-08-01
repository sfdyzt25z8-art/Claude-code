// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ProgressBar } from './ProgressBar';

function getFillWidth(container: HTMLElement): string {
  const fill = container.querySelector<HTMLElement>('.h-full');
  return fill?.style.width ?? '';
}

describe('ProgressBar', () => {
  it('sets the fill width proportional to value/max', () => {
    const { container } = render(<ProgressBar value={25} max={100} />);
    expect(getFillWidth(container)).toBe('25%');
  });

  it('clamps the fill width at 100% when value exceeds max', () => {
    const { container } = render(<ProgressBar value={150} max={100} />);
    expect(getFillWidth(container)).toBe('100%');
  });

  it('clamps the fill width at 0% for a negative value', () => {
    const { container } = render(<ProgressBar value={-10} max={100} />);
    expect(getFillWidth(container)).toBe('0%');
  });

  it('does not divide by zero when max is 0', () => {
    const { container } = render(<ProgressBar value={5} max={0} />);
    expect(getFillWidth(container)).toBe('0%');
  });

  it('renders the label when provided', () => {
    render(<ProgressBar value={1} max={10} label="1 / 10 XP" />);
    expect(screen.getByText('1 / 10 XP')).toBeInTheDocument();
  });

  it('renders no label text when omitted', () => {
    const { container } = render(<ProgressBar value={1} max={10} />);
    expect(container.querySelector('span')).not.toBeInTheDocument();
  });

  it('exposes progress semantics to assistive tech via ARIA', () => {
    render(<ProgressBar value={25} max={100} label="XP progress" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '25');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAccessibleName('XP progress');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ProgressBar value={40} max={100} label="Level progress" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

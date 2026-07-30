// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Toggle } from './Toggle';

describe('Toggle', () => {
  it('exposes its state via aria-checked for assistive tech', () => {
    render(<Toggle checked={true} onChange={() => {}} label="Dark mode" />);
    expect(screen.getByRole('switch', { name: 'Dark mode' })).toHaveAttribute('aria-checked', 'true');
  });

  it('reports unchecked state correctly', () => {
    render(<Toggle checked={false} onChange={() => {}} label="Dark mode" />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with the flipped value when clicked', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="Sound" />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('flips the other direction when already checked', () => {
    const onChange = vi.fn();
    render(<Toggle checked={true} onChange={onChange} label="Sound" />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Toggle checked={true} onChange={() => {}} label="Dark mode" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

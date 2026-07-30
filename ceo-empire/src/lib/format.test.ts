import { describe, it, expect } from 'vitest';
import { formatMoney, formatCompactNumber, formatPercent, formatNumber } from './format';

describe('formatMoney', () => {
  it('formats whole dollar amounts with no decimals', () => {
    expect(formatMoney(1500)).toBe('$1,500');
  });

  it('formats negative amounts with a leading minus', () => {
    expect(formatMoney(-250)).toBe('-$250');
  });

  it('shows cents for sub-$10 values so small prices are not truncated to $0', () => {
    expect(formatMoney(0.4)).toBe('$0.40');
    expect(formatMoney(9.5)).toBe('$9.50');
  });

  it('drops decimals once the value reaches $10', () => {
    expect(formatMoney(10)).toBe('$10');
  });

  it('supports compact notation', () => {
    expect(formatMoney(1_500_000, { compact: true })).toBe('$1.50M');
  });
});

describe('formatCompactNumber', () => {
  it('abbreviates thousands, millions, billions, trillions', () => {
    expect(formatCompactNumber(1_000)).toBe('1.00K');
    expect(formatCompactNumber(2_500_000)).toBe('2.50M');
    expect(formatCompactNumber(3_000_000_000)).toBe('3.00B');
    expect(formatCompactNumber(4_000_000_000_000)).toBe('4.00T');
  });

  it('drops decimal precision above 100x a tier', () => {
    expect(formatCompactNumber(150_000)).toBe('150K');
  });

  it('leaves sub-1000 values unabbreviated', () => {
    expect(formatCompactNumber(42)).toBe('42');
  });
});

describe('formatPercent', () => {
  it('converts a fraction to a percentage string', () => {
    expect(formatPercent(0.256, 1)).toBe('25.6%');
    expect(formatPercent(-0.05)).toBe('-5%');
  });
});

describe('formatNumber', () => {
  it('adds thousands separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });
});

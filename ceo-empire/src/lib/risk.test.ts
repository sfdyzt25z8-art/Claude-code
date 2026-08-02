import { describe, it, expect } from 'vitest';
import { getRiskLevel } from './risk';
import { INVESTMENT_ASSETS } from '@/data/investments';

describe('getRiskLevel', () => {
  it('buckets volatility into plain-language risk labels', () => {
    expect(getRiskLevel(0.005)).toBe('Low');
    expect(getRiskLevel(0.009)).toBe('Low');
    expect(getRiskLevel(0.01)).toBe('Medium');
    expect(getRiskLevel(0.025)).toBe('Medium');
    expect(getRiskLevel(0.03)).toBe('High');
    expect(getRiskLevel(0.059)).toBe('High');
    expect(getRiskLevel(0.06)).toBe('Very High');
    expect(getRiskLevel(0.2)).toBe('Very High');
  });

  it('gives every real investment asset a defined risk level', () => {
    for (const asset of INVESTMENT_ASSETS) {
      expect(['Low', 'Medium', 'High', 'Very High']).toContain(getRiskLevel(asset.volatility));
    }
  });

  it('flags MoonPup as the one Very High risk asset, keeping most other crypto/startups at High', () => {
    const moonpup = INVESTMENT_ASSETS.find((a) => a.id === 'moonpup')!;
    expect(getRiskLevel(moonpup.volatility)).toBe('Very High');

    // StableStack is a deliberate "stablecoin" outlier — genuinely Low risk despite being crypto.
    const otherCryptoAndStartups = INVESTMENT_ASSETS.filter(
      (a) => (a.category === 'crypto' || a.category === 'startup') && a.id !== 'moonpup' && a.id !== 'stablestack',
    );
    for (const asset of otherCryptoAndStartups) {
      expect(getRiskLevel(asset.volatility)).toBe('High');
    }
  });

  it('flags StableStack as a deliberately Low-risk crypto outlier', () => {
    const stablestack = INVESTMENT_ASSETS.find((a) => a.id === 'stablestack')!;
    expect(getRiskLevel(stablestack.volatility)).toBe('Low');
  });
});

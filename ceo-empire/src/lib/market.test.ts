import { describe, it, expect } from 'vitest';
import { createInitialState, GAME_DAY_SECONDS } from './gameEngine';
import { simulateMarketTick } from './market';
import { INVESTMENT_ASSETS } from '@/data/investments';

describe('simulateMarketTick', () => {
  it('produces a price and one new history point for every asset', () => {
    const state = createInitialState();
    const result = simulateMarketTick(state, 1);
    for (const asset of INVESTMENT_ASSETS) {
      expect(result.marketPrices[asset.id]).toBeGreaterThan(0);
      expect(result.priceHistory[asset.id]).toHaveLength(2); // initial seed point + new one
    }
  });

  it('never lets a price fall below 10% of its base price, across many ticks', () => {
    const state = createInitialState();
    let current = state;
    for (let i = 0; i < 200; i++) {
      const result = simulateMarketTick(current, 30);
      current = { ...current, ...result };
    }
    for (const asset of INVESTMENT_ASSETS) {
      expect(current.marketPrices[asset.id]).toBeGreaterThanOrEqual(asset.basePrice * 0.1 - 1e-9);
    }
  });

  it('caps price history length so it does not grow unbounded', () => {
    const state = createInitialState();
    let current = state;
    for (let i = 0; i < 250; i++) {
      const result = simulateMarketTick(current, 30);
      current = { ...current, ...result };
    }
    for (const asset of INVESTMENT_ASSETS) {
      expect(current.priceHistory[asset.id].length).toBeLessThanOrEqual(180);
    }
  });

  it('does not mutate the input state object', () => {
    const state = createInitialState();
    const snapshotPrice = state.marketPrices.vtx;
    simulateMarketTick(state, 100);
    expect(state.marketPrices.vtx).toBe(snapshotPrice);
  });

  it('scales one-day price shocks so realized volatility matches the configured asset volatility', () => {
    // Regression test: randNormal() used to sum 6 uniforms (variance 0.5) instead of 12
    // (variance 1), so every asset's realized volatility was ~29% lower than configured.
    const vtx = INVESTMENT_ASSETS.find((a) => a.id === 'vtx')!;
    const n = 4000;
    const returns: number[] = [];
    for (let i = 0; i < n; i++) {
      const state = createInitialState();
      state.marketPrices.vtx = vtx.basePrice;
      const result = simulateMarketTick(state, GAME_DAY_SECONDS); // dayFraction = 1
      returns.push(result.marketPrices.vtx / vtx.basePrice - 1 - vtx.drift);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / n;
    const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    const stdDev = Math.sqrt(variance);
    // Configured volatility is 0.02; the pre-fix bug would land this around
    // 0.02 * sqrt(0.5) ≈ 0.0141 instead.
    expect(stdDev).toBeGreaterThan(vtx.volatility * 0.85);
    expect(stdDev).toBeLessThan(vtx.volatility * 1.15);
  });
});

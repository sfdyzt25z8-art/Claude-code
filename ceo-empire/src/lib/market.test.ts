import { describe, it, expect } from 'vitest';
import { createInitialState } from './gameEngine';
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
});

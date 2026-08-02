import type { GameState } from '@/types/game';
import { INVESTMENT_ASSETS } from '@/data/investments';
import { GAME_DAY_SECONDS } from '@/lib/gameEngine';

const MAX_HISTORY_POINTS = 180;

/** Approximate standard-normal sample via the sum of uniforms (Irwin-Hall). */
function randNormal(): number {
  // Var[U(0,1)] = 1/12, so summing 12 of them gives unit variance once centered.
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Math.random();
  return sum - 6;
}

/**
 * Advances every asset's price by a random walk scaled to elapsed real seconds,
 * mutating a shallow-cloned marketPrices/priceHistory pair. Pure — returns new objects.
 */
export function simulateMarketTick(
  state: GameState,
  dtSeconds: number,
): Pick<GameState, 'marketPrices' | 'priceHistory'> {
  const dayFraction = dtSeconds / GAME_DAY_SECONDS;
  const marketPrices: Record<string, number> = { ...state.marketPrices };
  const priceHistory: GameState['priceHistory'] = { ...state.priceHistory };

  for (const asset of INVESTMENT_ASSETS) {
    const current = marketPrices[asset.id] ?? asset.basePrice;
    const drift = asset.drift * dayFraction;
    const shock = asset.volatility * Math.sqrt(Math.max(dayFraction, 0.0001)) * randNormal();
    const floor = asset.basePrice * 0.1;
    const next = Math.max(floor, current * (1 + drift + shock));
    marketPrices[asset.id] = next;

    const history = priceHistory[asset.id] ?? [];
    const nextHistory = [...history, { t: Date.now(), price: next }];
    if (nextHistory.length > MAX_HISTORY_POINTS) nextHistory.shift();
    priceHistory[asset.id] = nextHistory;
  }

  return { marketPrices, priceHistory };
}

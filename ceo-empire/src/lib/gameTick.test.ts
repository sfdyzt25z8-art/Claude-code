import { describe, it, expect, vi } from 'vitest';
import { createInitialState, GAME_DAY_SECONDS, NEGLECT_RATE } from './gameEngine';
import { advanceTime } from './gameTick';
import { xpForNextLevel } from '@/data/levels';
import { INVESTMENT_ASSETS } from '@/data/investments';
import type { OwnedBusiness } from '@/types/game';

function lemonadeStand(): OwnedBusiness {
  return {
    instanceId: 'biz_1',
    templateId: 'lemonade_stand',
    purchasedAt: 0,
    upgrades: { equipment: 0, marketing: 0, staff: 0, technology: 0, buildings: 0 },
    employeeIds: [],
  };
}

describe('advanceTime', () => {
  it('is a no-op for zero or negative elapsed time', () => {
    const state = createInitialState();
    const result = advanceTime(state, 0, state.lastTickAt);
    expect(result.state).toBe(state);
    expect(result.daysPassed).toBe(0);
  });

  it('accrues cash proportional to daily profit and elapsed time', () => {
    const state = createInitialState();
    state.businesses = [lemonadeStand()];
    // lemonade stand: $150 income - $40 expense - $37.50 neglect penalty (no marketing/staff) = $72.50/day profit
    const dailyProfit = 150 - (40 + 150 * NEGLECT_RATE);
    const elapsed = GAME_DAY_SECONDS / 2; // half a day
    const result = advanceTime(state, elapsed, state.lastTickAt + elapsed * 1000);
    expect(result.state.cash).toBeCloseTo(state.cash + dailyProfit / 2, 5);
  });

  it('does not roll the day forward for a small elapsed time', () => {
    const state = createInitialState();
    const result = advanceTime(state, 5, state.lastTickAt + 5000);
    expect(result.state.day).toBe(1);
    expect(result.daysPassed).toBe(0);
    expect(result.state.netWorthHistory).toHaveLength(1);
  });

  it('rolls the day forward once a full in-game day elapses, adding a net worth point', () => {
    const state = createInitialState();
    const now = state.lastTickAt + (GAME_DAY_SECONDS + 5) * 1000;
    const result = advanceTime(state, GAME_DAY_SECONDS + 5, now);
    expect(result.state.day).toBe(2);
    expect(result.daysPassed).toBe(1);
    expect(result.state.netWorthHistory).toHaveLength(2);
    expect(result.state.netWorthHistory.at(-1)?.day).toBe(2);
  });

  it('caps day rollover per call so a huge offline gap does not spin forever', () => {
    const state = createInitialState();
    const hugeElapsedSeconds = GAME_DAY_SECONDS * 50;
    const now = state.lastTickAt + hugeElapsedSeconds * 1000;
    const result = advanceTime(state, hugeElapsedSeconds, now);
    // day still jumps all the way to the computed day...
    expect(result.state.day).toBe(51);
    // ...but only up to MAX_DAYS_ROLLED_AT_ONCE events are actually rolled/logged
    expect(result.state.eventLog.length).toBeLessThanOrEqual(8);
  });

  it('unlocks achievements and grants their XP when a milestone is crossed', () => {
    const state = createInitialState();
    state.businesses = [lemonadeStand()];
    const result = advanceTime(state, 1, state.lastTickAt + 1000);
    expect(result.newAchievements).toContain('first_business');
    expect(result.state.achievementsUnlocked).toContain('first_business');
    expect(result.state.xp).toBeGreaterThan(0);
  });

  it('reports leveledUp when accumulated XP crosses the level-1 threshold', () => {
    const state = createInitialState();
    // Sit just 10 XP shy of the level-2 threshold; the "first_business" achievement
    // (50 XP) should be enough to push it over.
    state.xp = xpForNextLevel(1) - 10;
    state.level = 1;
    state.businesses = [lemonadeStand()];
    const result = advanceTime(state, 1, state.lastTickAt + 1000);
    expect(result.newAchievements).toContain('first_business');
    expect(result.leveledUp).toBe(true);
    expect(result.state.level).toBe(2);
  });

  it('grants fractional XP for small net worth gains instead of flooring them away to 0', () => {
    // A single 1-second tick still only grows net worth by a few dollars, which
    // used to floor to 0 XP every tick, making passive XP gain effectively dead.
    const state = createInitialState();
    state.businesses = [lemonadeStand()];
    state.achievementsUnlocked = ['first_business']; // isolate growth XP from achievement XP
    const result = advanceTime(state, 1, state.lastTickAt + 1000);
    expect(result.state.xp).toBeGreaterThan(0);
    expect(result.state.xp).toBeLessThan(1);
  });

  it('applies a one-time cash effect when a cash-target event triggers, not just a notification', () => {
    // Regression test: activeEventMultiplier only ever handles 'all_income'/'all_expenses',
    // so 'cash'-target events (like a tax refund) used to trigger and log a notification
    // without ever actually moving any money.
    const state = createInitialState();
    const randomSpy = vi.spyOn(Math, 'random');
    // simulateMarketTick draws 12 Math.random() values per asset before the event roll —
    // their value doesn't matter here, only the count needs to line up.
    for (let i = 0; i < INVESTMENT_ASSETS.length * 12; i++) randomSpy.mockReturnValueOnce(0.5);
    randomSpy.mockReturnValueOnce(0.1); // passes the 55% daily-event chance check
    randomSpy.mockReturnValueOnce(0.8); // rollRandomEvent: 0.8 * 55 = 44 -> tax_refund's (39, 48] slice

    const now = state.lastTickAt + (GAME_DAY_SECONDS + 5) * 1000;
    const result = advanceTime(state, GAME_DAY_SECONDS + 5, now);

    expect(result.triggeredEvents[0]?.templateId).toBe('tax_refund');
    // tax_refund: value 0.05 -> +5% of cash at trigger time, applied directly since
    // there is no ongoing income/expense multiplier for a one-time 'cash' event.
    expect(result.state.cash).toBeCloseTo(state.cash * 1.05, 5);

    randomSpy.mockRestore();
  });

  it('advances lastTickAt to the provided now', () => {
    const state = createInitialState();
    const now = state.lastTickAt + 1000;
    const result = advanceTime(state, 1, now);
    expect(result.state.lastTickAt).toBe(now);
  });
});

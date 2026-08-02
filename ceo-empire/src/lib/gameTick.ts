import type { ActiveEvent, GameState, NetWorthPoint } from '@/types/game';
import { GAME_DAY_SECONDS, computeEmpireTotals, computeNetWorth } from '@/lib/gameEngine';
import { simulateMarketTick } from '@/lib/market';
import { pruneExpiredEvents, rollDailyEvent } from '@/lib/eventsEngine';
import { getEventTemplate } from '@/data/events';
import { checkNewAchievements } from '@/lib/achievementsEngine';
import { levelProgressFromXp } from '@/data/levels';

export const MAX_OFFLINE_SECONDS = 12 * 60 * 60;
const MAX_DAYS_ROLLED_AT_ONCE = 8;
const NET_WORTH_HISTORY_LIMIT = 150;
/**
 * Real seconds between full business income/expense payouts. Business templates still
 * carry their numbers under "daily*" names, but that figure now pays out in full every
 * this-many real seconds instead of every GAME_DAY_SECONDS (180) — a 180x acceleration.
 */
export const INCOME_PAYOUT_SECONDS = 1;
/**
 * $ of net worth growth needed to earn 1 XP from passive play. Income payout just sped
 * up 180x (from once per GAME_DAY_SECONDS to once per INCOME_PAYOUT_SECONDS), so this is
 * scaled up by the same factor to keep the real-time XP earn rate unchanged.
 */
export const XP_PER_NET_WORTH_GROWTH = (20 / 24) * (GAME_DAY_SECONDS / INCOME_PAYOUT_SECONDS);

export interface AdvanceResult {
  state: GameState;
  triggeredEvents: ActiveEvent[];
  newAchievements: string[];
  leveledUp: boolean;
  daysPassed: number;
}

/**
 * Advances the game clock by `elapsedSeconds`, accruing profit, moving the market,
 * rolling day-change events/achievements, and granting XP. Used both for the live
 * 1s tick loop and for fast-forwarding offline progress on load.
 */
export function advanceTime(prev: GameState, elapsedSeconds: number, now: number): AdvanceResult {
  if (elapsedSeconds <= 0) {
    return { state: prev, triggeredEvents: [], newAchievements: [], leveledUp: false, daysPassed: 0 };
  }

  const netWorthBefore = computeNetWorth(prev);
  const totals = computeEmpireTotals(prev);
  // Business income/expense are keyed to INCOME_PAYOUT_SECONDS, not the (much longer)
  // GAME_DAY_SECONDS used for calendar/event pacing below.
  const payoutFraction = elapsedSeconds / INCOME_PAYOUT_SECONDS;
  const cashGain = totals.dailyProfit * payoutFraction;
  const market = simulateMarketTick(prev, elapsedSeconds);

  let state: GameState = {
    ...prev,
    cash: prev.cash + cashGain,
    totalIncomeEarned: prev.totalIncomeEarned + Math.max(0, totals.dailyIncome * payoutFraction),
    totalExpensesPaid: prev.totalExpensesPaid + Math.max(0, totals.dailyExpense * payoutFraction),
    marketPrices: market.marketPrices,
    priceHistory: market.priceHistory,
    lastTickAt: now,
  };

  const computedDay = Math.floor((now - state.gameStartedAt) / (GAME_DAY_SECONDS * 1000)) + 1;
  const targetDay = Math.max(state.day, computedDay);
  const triggeredEvents: ActiveEvent[] = [];
  const daysPassed = targetDay - state.day;

  if (daysPassed > 0) {
    const daysToRoll = Math.min(daysPassed, MAX_DAYS_ROLLED_AT_ONCE);
    let cursorDay = state.day;
    let activeEvents = state.activeEvents;
    let eventLog = state.eventLog;
    let cashDelta = 0;
    for (let i = 0; i < daysToRoll; i++) {
      cursorDay += 1;
      const roll = rollDailyEvent({ ...state, activeEvents, eventLog }, cursorDay);
      activeEvents = roll.activeEvents;
      eventLog = roll.eventLog;
      if (roll.triggered) {
        triggeredEvents.push(roll.triggered);
        // 'cash' events (e.g. a tax refund) are a one-time hit/bonus rather than an
        // ongoing income/expense multiplier — apply the effect directly here, since
        // activeEventMultiplier only ever handles 'all_income'/'all_expenses'.
        const tpl = getEventTemplate(roll.triggered.templateId);
        if (tpl?.target === 'cash') cashDelta += state.cash * tpl.value;
      }
    }
    activeEvents = pruneExpiredEvents(activeEvents, targetDay);
    state = { ...state, cash: state.cash + cashDelta };

    const nwPoint: NetWorthPoint = {
      day: targetDay,
      t: now,
      netWorth: computeNetWorth(state),
      cash: state.cash,
    };
    const netWorthHistory = [...state.netWorthHistory, nwPoint].slice(-NET_WORTH_HISTORY_LIMIT);

    state = { ...state, day: targetDay, activeEvents, eventLog, netWorthHistory };
  }

  const netWorthAfter = computeNetWorth(state);
  const { newly, xpGained: achievementXp } = checkNewAchievements(state, netWorthAfter);
  // Not floored: like cash, XP accrues fractionally every tick so slow, steady
  // profit growth still earns XP instead of being rounded away to 0 each tick.
  const growthXp = Math.max(0, (netWorthAfter - netWorthBefore) / XP_PER_NET_WORTH_GROWTH);
  const totalXpGained = achievementXp + growthXp;

  let leveledUp = false;
  if (totalXpGained > 0 || newly.length > 0) {
    const newXp = state.xp + totalXpGained;
    const progress = levelProgressFromXp(newXp);
    leveledUp = progress.level > state.level;
    state = {
      ...state,
      xp: newXp,
      level: progress.level,
      achievementsUnlocked: [...state.achievementsUnlocked, ...newly],
    };
  }

  return { state, triggeredEvents, newAchievements: newly, leveledUp, daysPassed };
}

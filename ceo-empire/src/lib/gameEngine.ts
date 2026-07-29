import type {
  ActiveEvent,
  Employee,
  GameSettings,
  GameState,
  OwnedBusiness,
} from '@/types/game';
import { UPGRADE_TYPES } from '@/types/game';
import { getBusinessTemplate } from '@/data/businesses';
import { UPGRADE_DEFINITIONS } from '@/data/upgrades';
import { EMPLOYEE_TEMPLATES } from '@/data/employees';
import { getEventTemplate } from '@/data/events';
import { INVESTMENT_ASSETS } from '@/data/investments';

export const STARTING_CASH = 10_000;
/** How many real-time seconds make up one in-game day. */
export const GAME_DAY_SECONDS = 180;

/** Net worth required to be eligible to Prestige. */
export const PRESTIGE_MIN_NET_WORTH = 5_000_000;
/** Permanent income multiplier granted per Prestige level. */
export const PRESTIGE_INCOME_BONUS_PER_LEVEL = 0.15;

export const DEFAULT_SETTINGS: GameSettings = {
  theme: 'dark',
  soundEnabled: true,
  musicEnabled: true,
};

export function createInitialState(): GameState {
  const now = Date.now();
  const marketPrices: Record<string, number> = {};
  const priceHistory: GameState['priceHistory'] = {};
  for (const asset of INVESTMENT_ASSETS) {
    marketPrices[asset.id] = asset.basePrice;
    priceHistory[asset.id] = [{ t: now, price: asset.basePrice }];
  }
  return {
    cash: STARTING_CASH,
    coins: 100,
    totalIncomeEarned: 0,
    totalExpensesPaid: 0,
    reputation: 50,
    xp: 0,
    level: 1,
    day: 1,
    gameStartedAt: now,
    businesses: [],
    employees: [],
    investments: [],
    marketPrices,
    priceHistory,
    achievementsUnlocked: [],
    activeEvents: [],
    eventLog: [],
    netWorthHistory: [{ day: 1, t: now, netWorth: STARTING_CASH, cash: STARTING_CASH }],
    lastTickAt: now,
    lastSavedAt: now,
    dailyReward: { lastClaimedAt: null, streak: 0 },
    prestige: { count: 0 },
    settings: DEFAULT_SETTINGS,
  };
}

/** Fills in defaults for any fields missing from an older/loaded save (schema drift safety net). */
export function hydrateState(raw: GameState): GameState {
  return {
    ...raw,
    coins: raw.coins ?? 0,
    prestige: raw.prestige ?? { count: 0 },
    settings: { ...DEFAULT_SETTINGS, ...raw.settings },
  };
}

/** Permanent income multiplier earned from past Prestige resets. */
export function prestigeMultiplier(state: GameState): number {
  return 1 + state.prestige.count * PRESTIGE_INCOME_BONUS_PER_LEVEL;
}

/**
 * Resets the empire to a fresh start in exchange for a permanent income boost.
 * Achievements, daily-reward streak, and settings survive the reset; everything
 * else — cash, businesses, employees, investments, XP/level, day — does not.
 */
export function prestigeReset(prev: GameState): GameState {
  const fresh = createInitialState();
  return {
    ...fresh,
    achievementsUnlocked: prev.achievementsUnlocked,
    dailyReward: prev.dailyReward,
    settings: prev.settings,
    prestige: { count: prev.prestige.count + 1 },
  };
}

/** Combined income/expense multiplier from all currently-active events. */
export function activeEventMultiplier(
  activeEvents: ActiveEvent[],
  target: 'all_income' | 'all_expenses',
): number {
  let mult = 1;
  for (const active of activeEvents) {
    const tpl = getEventTemplate(active.templateId);
    if (tpl && tpl.target === target) mult *= tpl.value;
  }
  return mult;
}

function upgradeMultipliers(business: OwnedBusiness): { income: number; expense: number } {
  let income = 1;
  let expense = 1;
  for (const type of UPGRADE_TYPES) {
    const level = business.upgrades[type] ?? 0;
    const def = UPGRADE_DEFINITIONS[type];
    income += def.incomePerLevel * level;
    expense += def.expensePerLevel * level;
  }
  return { income, expense: Math.max(0.1, expense) };
}

function employeeMultipliers(
  business: OwnedBusiness,
  employees: Employee[],
): { income: number; expense: number; salaries: number } {
  let income = 1;
  let expense = 1;
  let salaries = 0;
  const template = getBusinessTemplate(business.templateId);
  for (const empId of business.employeeIds) {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) continue;
    const def = EMPLOYEE_TEMPLATES[emp.type];
    const suited = template ? def.suitedCategories.includes(template.category) : false;
    const suitBonus = suited ? 1.5 : 1;
    income += def.incomeBoost * suitBonus;
    expense += def.expenseReduction * suitBonus;
    salaries += emp.dailySalary;
  }
  return { income, expense: Math.max(0.1, expense), salaries };
}

export interface BusinessFinancials {
  baseIncome: number;
  baseExpense: number;
  dailyIncome: number;
  dailyExpense: number;
  dailyProfit: number;
}

export function businessFinancials(
  business: OwnedBusiness,
  employees: Employee[],
  activeEvents: ActiveEvent[] = [],
): BusinessFinancials {
  const template = getBusinessTemplate(business.templateId);
  if (!template) {
    return { baseIncome: 0, baseExpense: 0, dailyIncome: 0, dailyExpense: 0, dailyProfit: 0 };
  }
  const up = upgradeMultipliers(business);
  const emp = employeeMultipliers(business, employees);
  const eventIncomeMult = activeEventMultiplier(activeEvents, 'all_income');
  const eventExpenseMult = activeEventMultiplier(activeEvents, 'all_expenses');

  const dailyIncome = template.baseDailyIncome * up.income * emp.income * eventIncomeMult;
  const dailyExpense =
    template.baseDailyExpense * up.expense * emp.expense * eventExpenseMult + emp.salaries;

  return {
    baseIncome: template.baseDailyIncome,
    baseExpense: template.baseDailyExpense,
    dailyIncome,
    dailyExpense,
    dailyProfit: dailyIncome - dailyExpense,
  };
}

export interface EmpireTotals {
  dailyIncome: number;
  dailyExpense: number;
  dailyProfit: number;
}

export function computeEmpireTotals(state: GameState): EmpireTotals {
  let dailyIncome = 0;
  let dailyExpense = 0;
  for (const business of state.businesses) {
    const fin = businessFinancials(business, state.employees, state.activeEvents);
    dailyIncome += fin.dailyIncome;
    dailyExpense += fin.dailyExpense;
  }
  // Prestige grants a permanent, empire-wide income boost (applied here rather than
  // per-business so each business's own numbers stay legible on its own).
  dailyIncome *= prestigeMultiplier(state);
  return { dailyIncome, dailyExpense, dailyProfit: dailyIncome - dailyExpense };
}

/** Approximate resale/asset value of a business, contributing to net worth. */
export function businessAssetValue(business: OwnedBusiness): number {
  const template = getBusinessTemplate(business.templateId);
  if (!template) return 0;
  let upgradeSpend = 0;
  for (const type of UPGRADE_TYPES) {
    const level = business.upgrades[type] ?? 0;
    const def = UPGRADE_DEFINITIONS[type];
    for (let i = 0; i < level; i++) {
      upgradeSpend += Math.round(template.baseCost * def.costMultipliers[i]);
    }
  }
  return Math.round(template.baseCost * 0.7 + upgradeSpend * 0.6);
}

export function investmentsValue(state: GameState): number {
  return state.investments.reduce((sum, holding) => {
    const price = state.marketPrices[holding.assetId] ?? 0;
    return sum + price * holding.quantity;
  }, 0);
}

export function computeNetWorth(state: GameState): number {
  const businessValue = state.businesses.reduce((sum, b) => sum + businessAssetValue(b), 0);
  return state.cash + businessValue + investmentsValue(state);
}

export function employeeCapacityUsed(business: OwnedBusiness): number {
  return business.employeeIds.length;
}

export function employeeCapacity(business: OwnedBusiness): number {
  const template = getBusinessTemplate(business.templateId);
  if (!template) return 0;
  const buildingLevel = business.upgrades.buildings ?? 0;
  return template.baseEmployeeCapacity + buildingLevel * 2;
}

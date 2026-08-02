import { describe, it, expect } from 'vitest';
import type { Employee, OwnedBusiness } from '@/types/game';
import {
  STARTING_CASH,
  PRESTIGE_MIN_NET_WORTH,
  PRESTIGE_INCOME_BONUS_PER_LEVEL,
  NEGLECT_RATE,
  NEGLECT_RELIEF_LEVELS,
  createInitialState,
  businessFinancials,
  neglectPenalty,
  computeEmpireTotals,
  businessAssetValue,
  investmentsValue,
  computeNetWorth,
  employeeCapacity,
  employeeCapacityUsed,
  activeEventMultiplier,
  prestigeMultiplier,
  prestigeReset,
  hydrateState,
  educationMultiplier,
  EDUCATION_BONUS_PER_10_POINTS,
  UNEDUCATED_PENALTY,
  UNEDUCATED_RELIEF_EDUCATION,
} from './gameEngine';

function freshBusiness(overrides: Partial<OwnedBusiness> = {}): OwnedBusiness {
  return {
    instanceId: 'biz_test',
    templateId: 'lemonade_stand',
    purchasedAt: 0,
    upgrades: { equipment: 0, marketing: 0, staff: 0, technology: 0, buildings: 0 },
    employeeIds: [],
    ...overrides,
  };
}

/** Lemonade Stand, fully neglected: $150 base income, $40 base expense, $37.50 neglect penalty. */
const LEMONADE_NEGLECT = 150 * NEGLECT_RATE;

describe('createInitialState', () => {
  it('gives the player the starting cash and a clean slate', () => {
    const state = createInitialState();
    expect(state.cash).toBe(STARTING_CASH);
    expect(state.level).toBe(1);
    expect(state.day).toBe(1);
    expect(state.businesses).toEqual([]);
    expect(state.netWorthHistory).toHaveLength(1);
  });

  it('seeds market prices for every investment asset', () => {
    const state = createInitialState();
    expect(state.marketPrices.vtx).toBeGreaterThan(0);
    expect(Object.keys(state.marketPrices).length).toBeGreaterThan(0);
    expect(state.priceHistory.vtx).toHaveLength(1);
  });
});

describe('neglectPenalty', () => {
  it('applies the full penalty when Marketing and Staff are both untouched', () => {
    expect(neglectPenalty(freshBusiness(), 150)).toBeCloseTo(150 * NEGLECT_RATE);
  });

  it('shrinks linearly as combined marketing+staff levels rise', () => {
    const halfway = freshBusiness({
      upgrades: { equipment: 0, marketing: NEGLECT_RELIEF_LEVELS / 2, staff: 0, technology: 0, buildings: 0 },
    });
    expect(neglectPenalty(halfway, 150)).toBeCloseTo(150 * NEGLECT_RATE * 0.5);
  });

  it('fully offsets once combined marketing+staff levels reach the relief threshold', () => {
    const relieved = freshBusiness({
      upgrades: { equipment: 0, marketing: NEGLECT_RELIEF_LEVELS, staff: 0, technology: 0, buildings: 0 },
    });
    expect(neglectPenalty(relieved, 150)).toBe(0);
  });

  it('never goes negative once relief exceeds the threshold', () => {
    const overRelieved = freshBusiness({
      upgrades: { equipment: 0, marketing: 5, staff: 5, technology: 0, buildings: 0 },
    });
    expect(neglectPenalty(overRelieved, 150)).toBe(0);
  });
});

describe('businessFinancials', () => {
  it('returns the base income and includes the full neglect penalty for a fresh, unstaffed business', () => {
    const fin = businessFinancials(freshBusiness(), []);
    expect(fin.dailyIncome).toBeCloseTo(150);
    expect(fin.neglectPenalty).toBeCloseTo(LEMONADE_NEGLECT);
    expect(fin.dailyExpense).toBeCloseTo(40 + LEMONADE_NEGLECT);
    expect(fin.dailyProfit).toBeCloseTo(150 - (40 + LEMONADE_NEGLECT));
  });

  it('increases income with an equipment upgrade (no effect on the neglect penalty)', () => {
    const business = freshBusiness({
      upgrades: { equipment: 1, marketing: 0, staff: 0, technology: 0, buildings: 0 },
    });
    const fin = businessFinancials(business, []);
    // equipment adds +8% income per level, no expense multiplier change
    expect(fin.dailyIncome).toBeCloseTo(150 * 1.08);
    expect(fin.dailyExpense).toBeCloseTo(40 + LEMONADE_NEGLECT);
  });

  it('marketing upgrades shrink the neglect penalty on top of their own income/expense effect', () => {
    const business = freshBusiness({
      upgrades: { equipment: 0, marketing: 2, staff: 0, technology: 0, buildings: 0 },
    });
    const fin = businessFinancials(business, []);
    // marketing: +10% income, +2% expense per level; 2 levels of relief halves the neglect penalty.
    expect(fin.dailyIncome).toBeCloseTo(150 * 1.2);
    expect(fin.neglectPenalty).toBeCloseTo(LEMONADE_NEGLECT * 0.5);
    expect(fin.dailyExpense).toBeCloseTo(40 * 1.04 + LEMONADE_NEGLECT * 0.5);
  });

  it('applies a suited employee boost plus their salary as an added expense', () => {
    const business = freshBusiness({ employeeIds: ['emp_1'] });
    const cashier: Employee = {
      id: 'emp_1',
      type: 'cashier',
      name: 'Test Cashier',
      hiredAt: 0,
      assignedBusinessId: 'biz_test',
      dailySalary: 60,
      skillLevel: 0,
    };
    const fin = businessFinancials(business, [cashier]);
    // cashier incomeBoost 0.04, suited to 'food' -> 1.5x bonus => +6% income
    expect(fin.dailyIncome).toBeCloseTo(150 * 1.06);
    // no expense multiplier change for cashier, but salary and the neglect penalty are both added flat
    expect(fin.dailyExpense).toBeCloseTo(40 + 60 + LEMONADE_NEGLECT);
  });

  it('boosts a suited employee further with their training/skill level', () => {
    const business = freshBusiness({ employeeIds: ['emp_1'] });
    const trainedCashier: Employee = {
      id: 'emp_1',
      type: 'cashier',
      name: 'Trained Cashier',
      hiredAt: 0,
      assignedBusinessId: 'biz_test',
      dailySalary: 60,
      skillLevel: 2,
    };
    const fin = businessFinancials(business, [trainedCashier]);
    // 2 skill levels = +30% bonus on top of the suited incomeBoost: 0.04 * 1.5 * 1.3
    expect(fin.dailyIncome).toBeCloseTo(150 * (1 + 0.04 * 1.5 * 1.3));
  });

  it('ignores an employeeId that has no matching employee record', () => {
    const business = freshBusiness({ employeeIds: ['ghost'] });
    const fin = businessFinancials(business, []);
    expect(fin.dailyIncome).toBeCloseTo(150);
  });

  it('multiplies income/expenses by active event effects', () => {
    const business = freshBusiness();
    const fin = businessFinancials(business, [], [
      { id: 'e1', templateId: 'economic_boom', startedOnDay: 1, endsOnDay: 4 },
    ]);
    expect(fin.dailyIncome).toBeCloseTo(150 * 1.25);
  });

  it('falls back to zeroed financials for an unknown template id', () => {
    const business = freshBusiness({ templateId: 'does_not_exist' });
    const fin = businessFinancials(business, []);
    expect(fin).toEqual({ baseIncome: 0, baseExpense: 0, dailyIncome: 0, dailyExpense: 0, dailyProfit: 0, neglectPenalty: 0 });
  });
});

describe('computeEmpireTotals', () => {
  it('sums income/expenses across all owned businesses', () => {
    const state = createInitialState();
    state.businesses = [
      freshBusiness({ instanceId: 'a', templateId: 'lemonade_stand' }),
      freshBusiness({ instanceId: 'b', templateId: 'coffee_shop' }),
    ];
    const totals = computeEmpireTotals(state);
    const coffeeShopNeglect = 600 * NEGLECT_RATE;
    // Fresh state has 0 education, so the uneducated penalty (educationMultiplier) applies to income.
    expect(totals.dailyIncome).toBeCloseTo((150 + 600) * educationMultiplier(state));
    expect(totals.dailyExpense).toBeCloseTo(40 + LEMONADE_NEGLECT + 200 + coffeeShopNeglect);
    expect(totals.dailyProfit).toBeCloseTo(totals.dailyIncome - totals.dailyExpense);
  });

  it('returns zeros when no businesses are owned', () => {
    const state = createInitialState();
    const totals = computeEmpireTotals(state);
    expect(totals).toEqual({ dailyIncome: 0, dailyExpense: 0, dailyProfit: 0 });
  });
});

describe('businessAssetValue', () => {
  it('values a fresh business at 70% of its purchase cost', () => {
    expect(businessAssetValue(freshBusiness())).toBe(Math.round(500 * 0.7));
  });

  it('increases with upgrade spend', () => {
    const upgraded = freshBusiness({
      upgrades: { equipment: 2, marketing: 0, staff: 0, technology: 0, buildings: 0 },
    });
    expect(businessAssetValue(upgraded)).toBeGreaterThan(businessAssetValue(freshBusiness()));
  });
});

describe('net worth and investments', () => {
  it('computes investments value from quantity * current market price', () => {
    const state = createInitialState();
    state.marketPrices.vtx = 50;
    state.investments = [{ assetId: 'vtx', quantity: 10, avgBuyPrice: 42 }];
    expect(investmentsValue(state)).toBe(500);
  });

  it('sums cash, business asset value, and investment value', () => {
    const state = createInitialState();
    state.cash = 1000;
    state.businesses = [freshBusiness()];
    state.marketPrices.vtx = 10;
    state.investments = [{ assetId: 'vtx', quantity: 5, avgBuyPrice: 10 }];
    const expected = 1000 + businessAssetValue(freshBusiness()) + 50;
    expect(computeNetWorth(state)).toBe(expected);
  });
});

describe('employee capacity', () => {
  it('starts at the template base capacity', () => {
    expect(employeeCapacity(freshBusiness())).toBe(2);
    expect(employeeCapacityUsed(freshBusiness())).toBe(0);
  });

  it('grows by 2 per buildings upgrade level', () => {
    const business = freshBusiness({
      upgrades: { equipment: 0, marketing: 0, staff: 0, technology: 0, buildings: 3 },
    });
    expect(employeeCapacity(business)).toBe(2 + 3 * 2);
  });

  it('counts assigned employee ids as used capacity', () => {
    const business = freshBusiness({ employeeIds: ['a', 'b'] });
    expect(employeeCapacityUsed(business)).toBe(2);
  });
});

describe('activeEventMultiplier', () => {
  it('multiplies together only events matching the requested target', () => {
    const events = [
      { id: '1', templateId: 'economic_boom', startedOnDay: 1, endsOnDay: 4 }, // all_income x1.25
      { id: '2', templateId: 'equipment_failure', startedOnDay: 1, endsOnDay: 3 }, // all_expenses x1.3
    ];
    expect(activeEventMultiplier(events, 'all_income')).toBeCloseTo(1.25);
    expect(activeEventMultiplier(events, 'all_expenses')).toBeCloseTo(1.3);
  });

  it('returns 1 when there are no active events', () => {
    expect(activeEventMultiplier([], 'all_income')).toBe(1);
  });
});

describe('prestige', () => {
  it('grants a 1.0x multiplier with zero prestiges', () => {
    const state = createInitialState();
    expect(prestigeMultiplier(state)).toBe(1);
  });

  it('increases the multiplier by PRESTIGE_INCOME_BONUS_PER_LEVEL per prestige count', () => {
    const state = createInitialState();
    state.prestige = { count: 3 };
    expect(prestigeMultiplier(state)).toBeCloseTo(1 + 3 * PRESTIGE_INCOME_BONUS_PER_LEVEL);
  });

  it('boosts empire-wide income totals but not per-business financials', () => {
    const state = createInitialState();
    state.businesses = [freshBusiness()];
    state.prestige = { count: 2 };
    const totals = computeEmpireTotals(state);
    const mult = prestigeMultiplier(state) * educationMultiplier(state);
    expect(totals.dailyIncome).toBeCloseTo(150 * mult);
    // The per-business breakdown stays at base numbers, unaffected by prestige.
    const fin = businessFinancials(state.businesses[0], []);
    expect(fin.dailyIncome).toBeCloseTo(150);
  });

  it('resets cash, businesses, level, and day, while preserving achievements and settings', () => {
    const prev = createInitialState();
    prev.cash = 9_000_000;
    prev.businesses = [freshBusiness()];
    prev.employees = [];
    prev.level = 12;
    prev.day = 40;
    prev.achievementsUnlocked = ['first_business', 'net_worth_100k'];
    prev.settings = { ...prev.settings, theme: 'light' };
    prev.dailyReward = { lastClaimedAt: 12345, streak: 4 };

    const next = prestigeReset(prev);

    expect(next.cash).toBe(STARTING_CASH);
    expect(next.businesses).toEqual([]);
    expect(next.level).toBe(1);
    expect(next.day).toBe(1);
    expect(next.achievementsUnlocked).toEqual(['first_business', 'net_worth_100k']);
    expect(next.settings.theme).toBe('light');
    expect(next.dailyReward).toEqual({ lastClaimedAt: 12345, streak: 4 });
    expect(next.prestige.count).toBe(1);
  });

  it('increments prestige count across repeated resets', () => {
    let state = createInitialState();
    state = prestigeReset(state);
    state = prestigeReset(state);
    expect(state.prestige.count).toBe(2);
  });

  it('exposes a minimum net worth threshold greater than the starting cash', () => {
    expect(PRESTIGE_MIN_NET_WORTH).toBeGreaterThan(STARTING_CASH);
  });
});

describe('hydrateState', () => {
  it('fills in a missing prestige field for an older save', () => {
    const state = createInitialState();
    // Simulate a save persisted before the prestige field existed.
    const legacy = { ...state } as Omit<typeof state, 'prestige'> & { prestige?: unknown };
    delete legacy.prestige;
    const hydrated = hydrateState(legacy as typeof state);
    expect(hydrated.prestige).toEqual({ count: 0 });
  });

  it('leaves an already-valid state unchanged', () => {
    const state = createInitialState();
    state.prestige = { count: 4 };
    const hydrated = hydrateState(state);
    expect(hydrated.prestige).toEqual({ count: 4 });
  });

  it('defaults lifestyle fields and per-employee skillLevel for an older save', () => {
    const state = createInitialState();
    const legacy = { ...state } as Omit<typeof state, 'totalLifestyleSpend' | 'lifestyleOwned'> & {
      totalLifestyleSpend?: unknown;
      lifestyleOwned?: unknown;
    };
    delete legacy.totalLifestyleSpend;
    delete legacy.lifestyleOwned;
    legacy.employees = [
      { id: 'e1', type: 'cashier', name: 'Old Hire', hiredAt: 0, assignedBusinessId: null, dailySalary: 60 } as Employee,
    ];
    const hydrated = hydrateState(legacy as typeof state);
    expect(hydrated.totalLifestyleSpend).toBe(0);
    expect(hydrated.lifestyleOwned).toEqual({});
    expect(hydrated.employees[0].skillLevel).toBe(0);
  });

  it('defaults education fields for an older save', () => {
    const state = createInitialState();
    const legacy = { ...state } as Omit<typeof state, 'education' | 'totalEducationSpend' | 'activitiesCompleted'> & {
      education?: unknown;
      totalEducationSpend?: unknown;
      activitiesCompleted?: unknown;
    };
    delete legacy.education;
    delete legacy.totalEducationSpend;
    delete legacy.activitiesCompleted;
    const hydrated = hydrateState(legacy as typeof state);
    expect(hydrated.education).toBe(0);
    expect(hydrated.totalEducationSpend).toBe(0);
    expect(hydrated.activitiesCompleted).toEqual({});
  });

  it('migrates an employee hired during the hourly-pacing window (hourlySalary) back into dailySalary', () => {
    const state = createInitialState();
    const legacyEmployee = { id: 'e1', type: 'cashier', name: 'Old Hire', hiredAt: 0, assignedBusinessId: null, skillLevel: 0, hourlySalary: 60 };
    const legacy = { ...state, employees: [legacyEmployee] } as unknown as typeof state;
    const hydrated = hydrateState(legacy);
    expect(hydrated.employees[0].dailySalary).toBe(60);
  });

  it('recovers NaN-poisoned cash using the last finite net worth history point', () => {
    const state = createInitialState();
    const legacy = {
      ...state,
      cash: NaN,
      totalExpensesPaid: NaN,
      netWorthHistory: [
        { day: 1, t: 0, netWorth: 10_000, cash: 10_000 },
        { day: 2, t: 1000, netWorth: 12_500, cash: 12_500 },
        { day: 3, t: 2000, netWorth: NaN, cash: NaN },
      ],
    };
    const hydrated = hydrateState(legacy);
    expect(hydrated.cash).toBe(12_500);
    expect(hydrated.totalExpensesPaid).toBe(0);
  });

  it('falls back to the starting cash when no finite history point exists to recover from', () => {
    const state = createInitialState();
    const legacy = {
      ...state,
      cash: NaN,
      netWorthHistory: [{ day: 1, t: 0, netWorth: NaN, cash: NaN }],
    };
    const hydrated = hydrateState(legacy);
    expect(hydrated.cash).toBe(STARTING_CASH);
  });
});

describe('educationMultiplier', () => {
  it('applies the full uneducated penalty at zero education', () => {
    const state = createInitialState();
    expect(educationMultiplier(state)).toBeCloseTo(1 - UNEDUCATED_PENALTY);
  });

  it('shrinks the penalty linearly as education rises toward the relief threshold', () => {
    const state = createInitialState();
    // Below the first bonus tier (10 points) so this isolates the penalty term.
    state.education = 5;
    const expectedPenalty = UNEDUCATED_PENALTY * (1 - 5 / UNEDUCATED_RELIEF_EDUCATION);
    expect(educationMultiplier(state)).toBeCloseTo(1 - expectedPenalty);
  });

  it('fully offsets the penalty once education reaches the relief threshold (any bonus already earned still applies)', () => {
    const state = createInitialState();
    state.education = UNEDUCATED_RELIEF_EDUCATION;
    const bonusOnly = 1 + Math.floor(state.education / 10) * EDUCATION_BONUS_PER_10_POINTS;
    expect(educationMultiplier(state)).toBeCloseTo(bonusOnly);
  });

  it('grants a bonus per 10 points of education, rounding down', () => {
    const state = createInitialState();
    state.education = 25; // 2 full tens, past the relief threshold
    expect(educationMultiplier(state)).toBeCloseTo(1 + 2 * EDUCATION_BONUS_PER_10_POINTS);
  });

  it('caps out at 100 education', () => {
    const state = createInitialState();
    state.education = 100;
    expect(educationMultiplier(state)).toBeCloseTo(1 + 10 * EDUCATION_BONUS_PER_10_POINTS);
  });
});

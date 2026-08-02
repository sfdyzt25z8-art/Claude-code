import { describe, it, expect } from 'vitest';
import type { OwnedBusiness } from '@/types/game';
import { createInitialState, businessFinancials } from './gameEngine';
import { generateAdvice, businessProfitExplainer } from './aiAdvisor';
import { formatMoney } from './format';

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

describe('generateAdvice', () => {
  it('tells a brand-new player to buy their first business', () => {
    const state = createInitialState();
    const advice = generateAdvice(state);
    expect(advice.find((a) => a.id === 'first_business')).toBeDefined();
    expect(advice.find((a) => a.id === 'recommend_business')).toBeUndefined();
  });

  it('recommends the next affordable business once one is owned', () => {
    const state = createInitialState();
    state.businesses = [freshBusiness()];
    const advice = generateAdvice(state);
    const rec = advice.find((a) => a.id === 'recommend_business');
    expect(rec).toBeDefined();
    // Cheapest unowned business is the Newsstand ($350).
    expect(rec!.title).toMatch(/Newsstand/);
  });

  it('phrases the recommendation as affordable when the player has enough cash', () => {
    const state = createInitialState();
    state.businesses = [freshBusiness()];
    state.cash = 100_000; // comfortably more than the $350 newsstand
    const advice = generateAdvice(state);
    const rec = advice.find((a) => a.id === 'recommend_business')!;
    expect(rec.title).toBe('Buy a Newsstand');
    expect(rec.detail).toMatch(/You can afford it now/);
  });

  it('phrases the recommendation as a savings goal when the player cannot afford it', () => {
    const state = createInitialState();
    state.businesses = [freshBusiness()];
    state.cash = 0;
    const advice = generateAdvice(state);
    const rec = advice.find((a) => a.id === 'recommend_business')!;
    expect(rec.title).toBe('Save up for a Newsstand');
    expect(rec.detail).toMatch(/you need/);
  });

  it('suggests an upgrade once a business can afford one', () => {
    const state = createInitialState();
    state.businesses = [freshBusiness()];
    state.cash = 1000; // enough for the cheapest lemonade-stand upgrade
    const advice = generateAdvice(state);
    expect(advice.find((a) => a.id === 'recommend_upgrade')).toBeDefined();
  });

  it('flags an understaffed business with open employee slots', () => {
    const state = createInitialState();
    state.businesses = [freshBusiness()]; // lemonade stand: capacity 2, 0 employees
    const advice = generateAdvice(state);
    const tip = advice.find((a) => a.id === 'hire_tip');
    expect(tip).toBeDefined();
    expect(tip!.title).toMatch(/Lemonade Stand/);
  });

  it('does not flag hiring once a business is fully staffed', () => {
    const state = createInitialState();
    state.businesses = [freshBusiness({ employeeIds: ['e1', 'e2'] })]; // capacity 2, both filled
    state.employees = [
      { id: 'e1', type: 'cashier', name: 'A', hiredAt: 0, assignedBusinessId: 'biz_test', dailySalary: 60, skillLevel: 0 },
      { id: 'e2', type: 'cashier', name: 'B', hiredAt: 0, assignedBusinessId: 'biz_test', dailySalary: 60, skillLevel: 0 },
    ];
    const advice = generateAdvice(state);
    expect(advice.find((a) => a.id === 'hire_tip')).toBeUndefined();
  });

  it('suggests investing idle cash once a business is owned and cash is plentiful', () => {
    const state = createInitialState();
    state.businesses = [freshBusiness()];
    state.cash = 50_000;
    const advice = generateAdvice(state);
    expect(advice.find((a) => a.id === 'idle_cash')).toBeDefined();
  });

  it('does not suggest investing before any business is owned, even with cash on hand', () => {
    const state = createInitialState();
    state.cash = 50_000;
    const advice = generateAdvice(state);
    expect(advice.find((a) => a.id === 'idle_cash')).toBeUndefined();
  });

  it('warns when the empire is losing money overall', () => {
    const state = createInitialState();
    // Marketing upgrade raises expenses faster than income at high levels is hard to force;
    // easiest reliable way to force a loss is heavy employee salaries via many hires.
    state.businesses = [freshBusiness({ employeeIds: ['e1'] })];
    state.employees = [
      { id: 'e1', type: 'developer', name: 'Costly Dev', hiredAt: 0, assignedBusinessId: 'biz_test', dailySalary: 10_000, skillLevel: 0 },
    ];
    const advice = generateAdvice(state);
    expect(advice.find((a) => a.id === 'negative_profit')).toBeDefined();
  });

  it('always includes a profit explainer summary as the final item', () => {
    const state = createInitialState();
    const advice = generateAdvice(state);
    expect(advice.at(-1)?.id).toBe('explain_profit');
    expect(advice.at(-1)?.tone).toBe('summary');
  });

  it('never returns more than 6 items', () => {
    const state = createInitialState();
    state.businesses = [freshBusiness({ employeeIds: ['e1'] })];
    state.employees = [
      { id: 'e1', type: 'developer', name: 'Costly Dev', hiredAt: 0, assignedBusinessId: 'biz_test', dailySalary: 10_000, skillLevel: 0 },
    ];
    state.cash = 50_000;
    const advice = generateAdvice(state);
    expect(advice.length).toBeLessThanOrEqual(6);
  });
});

describe('businessProfitExplainer', () => {
  it('returns null for a business the player does not own', () => {
    const state = createInitialState();
    expect(businessProfitExplainer(state, 'nope')).toBeNull();
  });

  it('summarizes income, expense, and profit for an owned business', () => {
    const state = createInitialState();
    state.businesses = [freshBusiness()];
    const summary = businessProfitExplainer(state, 'biz_test');
    const fin = businessFinancials(state.businesses[0], state.employees);
    expect(summary).toContain('Lemonade Stand');
    expect(summary).toContain(formatMoney(fin.dailyIncome, { compact: true }));
    expect(summary).toContain(formatMoney(fin.dailyExpense, { compact: true }));
    expect(summary).toContain(`profit of ${formatMoney(fin.dailyProfit, { compact: true })}/day`);
    // A fresh business with no Marketing/Staff investment should be bleeding money
    // to the neglect penalty, so expense is meaningfully above the raw base expense.
    expect(fin.dailyExpense).toBeGreaterThan(fin.baseExpense);
  });
});
